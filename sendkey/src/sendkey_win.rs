use windows::core::PWSTR;
use windows::Win32::Foundation::HGLOBAL;
use windows::Win32::System::Diagnostics::Debug::{FormatMessageW, FORMAT_MESSAGE_FROM_SYSTEM};
use windows::Win32::System::Memory::{GlobalLock, GlobalUnlock};
use windows::Win32::UI::Input::KeyboardAndMouse::{
  GetKeyState, SendInput, INPUT, INPUT_0, INPUT_KEYBOARD, KEYBDINPUT, KEYBD_EVENT_FLAGS,
  KEYEVENTF_KEYUP, VIRTUAL_KEY, VK_CONTROL, VK_MENU, VK_RETURN, VK_SHIFT, VK_SPACE,
};

use windows::Win32::System::DataExchange::{
  CloseClipboard, GetClipboardData, IsClipboardFormatAvailable, OpenClipboard,
};
use windows::Win32::UI::Shell::{DragQueryFileW, HDROP};

const CF_HDROP: u32 = 15; // Clipboard format for file drop lists

fn ignore_pressed(vk: VIRTUAL_KEY) -> Option<VIRTUAL_KEY> {
  let state = unsafe { GetKeyState(vk.0.into()) } as u16;
  if state & 0x8000_u16 != 0 {
    return None;
  }
  Some(vk)
}

fn vk_code(key: &str) -> Option<VIRTUAL_KEY> {
  if key.len() == 1 {
    return Some(VIRTUAL_KEY(key.as_bytes()[0] as u16));
  }
  match key {
    "CTRL" => ignore_pressed(VK_CONTROL),
    "SHIFT" => ignore_pressed(VK_SHIFT),
    "ALT" => ignore_pressed(VK_MENU),
    "ENTER" => Some(VK_RETURN),
    "SPACE" => Some(VK_SPACE),
    _ => None, // Handle other keys as needed
  }
}

fn parse_keys(keys: &str) -> Result<Vec<INPUT>, String> {
  let mut inputs = Vec::new();

  let keys = keys
    .to_ascii_uppercase()
    .split(|c| c == ' ' || c == '+' || c == '-')
    .filter_map(vk_code)
    .collect::<Vec<_>>();

  // add key down events
  for &key in keys.iter() {
    let input = INPUT {
      r#type: INPUT_KEYBOARD,
      Anonymous: INPUT_0 {
        ki: KEYBDINPUT {
          wVk: key,
          wScan: 0,
          dwFlags: KEYBD_EVENT_FLAGS(0),
          time: 0,
          dwExtraInfo: 0,
        },
      },
    };
    inputs.push(input);
  }

  // add key up events
  for &key in keys.iter().rev() {
    let input = INPUT {
      r#type: INPUT_KEYBOARD,
      Anonymous: INPUT_0 {
        ki: KEYBDINPUT {
          wVk: key,
          wScan: 0,
          dwFlags: KEYEVENTF_KEYUP,
          time: 0,
          dwExtraInfo: 0,
        },
      },
    };
    inputs.push(input);
  }

  Ok(inputs)
}

pub(crate) fn send_keys(keys: &str) -> Result<(), String> {
  let inputs = parse_keys(keys)?;

  if inputs.is_empty() {
    return Err("No keys to send".to_string());
  }
  let result = unsafe { SendInput(inputs.as_slice(), std::mem::size_of::<INPUT>() as i32) };
  if result == 0 {
    return Err("Failed to send keys".to_string());
  }
  Ok(())
}

fn get_last_error() -> String {
  use windows::Win32::Foundation::GetLastError;
  let error_code = unsafe { GetLastError() };
  // get error message from error code
  if error_code.0 == 0 {
    return "".to_string();
  }

  let mut buffer = [0u16; 1024];
  let lpbuffer = PWSTR(buffer.as_mut_ptr());
  let length = unsafe {
    FormatMessageW(
      FORMAT_MESSAGE_FROM_SYSTEM,
      None,
      error_code.0,
      0,
      lpbuffer,
      buffer.len() as u32,
      None,
    )
  };

  let message = PWSTR(buffer[..length as usize].as_mut_ptr());

  format!("Code: {} {}", error_code.0, unsafe {
    message.to_string().unwrap_or_default()
  })
}

pub(crate) fn get_clipboard_files() -> Result<Vec<String>, String> {
  let files = unsafe { get_clipboard_files_inner() };

  unsafe {
    // Ensure the clipboard is closed after accessing it
    CloseClipboard().unwrap_or_default();
  }

  files.map_err(|e| {
    let message = e.message();
    if message.is_empty() {
      get_last_error()
    } else {
      message
    }
  })
}

unsafe fn get_clipboard_files_inner() -> windows::core::Result<Vec<String>> {
  let mut files = Vec::new();

  IsClipboardFormatAvailable(CF_HDROP)?;

  OpenClipboard(None)?;

  let handle = GetClipboardData(CF_HDROP)?;

  let hdrop = HDROP(GlobalLock(HGLOBAL(handle.0)));

  let files_count = DragQueryFileW(hdrop, 0xFFFFFFFF, None);
  let mut buffer = [0u16; 1024];
  for i in 0..files_count {
    let length = DragQueryFileW(hdrop, i, Some(&mut buffer));
    if length > 0 {
      // Convert the wide string to a Rust String
      let file_name = String::from_utf16_lossy(&buffer[..length as usize]);
      files.push(file_name);
    }
  }
  GlobalUnlock(HGLOBAL(handle.0))?;
  Ok(files)
}
