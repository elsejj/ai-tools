#![deny(clippy::all)]

#[macro_use]
extern crate napi_derive;

mod sendkey_win;

#[napi]
pub fn send_keys(keys: String) -> Result<(), napi::Error> {
  #[cfg(target_os = "windows")]
  sendkey_win::send_keys(&keys).map_err(|e| napi::Error::from_reason(e))
}

#[napi]
pub fn get_clipboard_files() -> Result<Vec<String>, napi::Error> {
  #[cfg(target_os = "windows")]
  return sendkey_win::get_clipboard_files().map_err(|e| napi::Error::from_reason(e));
}
