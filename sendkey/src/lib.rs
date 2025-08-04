#![deny(clippy::all)]

#[macro_use]
extern crate napi_derive;

#[cfg(target_os = "windows")]
mod sendkey_win;

#[cfg(target_os = "linux")]
mod sendkey_linux;

#[napi]
pub fn send_keys(keys: String) -> Result<(), napi::Error> {
  #[cfg(target_os = "windows")]
  return sendkey_win::send_keys(&keys).map_err(|e| napi::Error::from_reason(e));

  #[cfg(target_os = "linux")]
  return sendkey_linux::send_keys(&keys).map_err(|e| napi::Error::from_reason(e));

  #[allow(unreachable_code)]
  Err(napi::Error::from_reason("send_keys is not supported on this platform"))
}

#[napi]
pub fn get_clipboard_files() -> Result<Vec<String>, napi::Error> {
  #[cfg(target_os = "windows")]
  return sendkey_win::get_clipboard_files().map_err(|e| napi::Error::from_reason(e));

  Ok(vec![]) // Placeholder for Linux implementation
}

#[napi]
/// give a chance to the module to initialize itself
/// for linux, it start the ydotool daemon
pub fn initialize_sendkey() -> Result<(), napi::Error> {

  Ok(())
}


#[napi]
/// give a chance to the module to finalize itself
/// for linux, it stop the ydotool daemon
pub fn finalize_sendkey() -> Result<(), napi::Error> {

  #[cfg(target_os = "linux")]
  return sendkey_linux::finalize_sendkey().map_err(|e| napi::Error::from_reason(e));

  #[allow(unreachable_code)]
  Ok(())
}