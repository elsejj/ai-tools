use windows::Win32::UI::Input::KeyboardAndMouse::{
  GetKeyState, SendInput, INPUT, INPUT_0, INPUT_KEYBOARD, KEYBDINPUT, KEYBD_EVENT_FLAGS,
  KEYEVENTF_KEYUP, VIRTUAL_KEY, VK_CONTROL, VK_MENU, VK_RETURN, VK_SHIFT, VK_SPACE,
};

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
