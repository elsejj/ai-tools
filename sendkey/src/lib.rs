#![deny(clippy::all)]

#[macro_use]
extern crate napi_derive;

mod sendkey_win;

#[napi]
pub fn sum(a: i32, b: i32) -> i32 {
  a + b
}

#[napi]
pub fn send_keys(keys: String) -> Result<(), napi::Error> {
  sendkey_win::send_keys(&keys).map_err(|e| napi::Error::from_reason(e))
}
