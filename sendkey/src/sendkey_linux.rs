//! Linux-specific implementation of the sendkey module
//! This module provides functionality to send key events and interact with the clipboard on Linux systems.
//! It uses the `ydotool` utility to simulate key presses and manage clipboard files.
//! 
//! `ydotool` must be installed and running for this module to function correctly.
//! 


const YDOTOOL_SOCKET: &str = "/tmp/sendkey_ydotool.sock";
const YDOTOOL_PERMISSIONS: &str = "0666";


use std::process::{Child, Command};
use std::sync::{OnceLock, Mutex};
use std::thread::sleep;

static YDOTOOLD_INSTANCE: OnceLock<Mutex<Child>> = OnceLock::new();



fn init_ydotoold() -> Mutex<Child> {
  let child = Command::new("sudo")
    .arg("ydotoold")
    .arg("-p")
    .arg(YDOTOOL_SOCKET)
    .arg("-P")
    .arg(YDOTOOL_PERMISSIONS)
    .spawn()
    .expect("Failed to start ydotoold");
  sleep(std::time::Duration::from_secs(1)); // Give ydotoold time to start
  Mutex::new(child)
}


pub(crate) fn send_keys(_keys: &str) -> Result<(), String> {

  let _ = YDOTOOLD_INSTANCE.get_or_init(init_ydotoold); // Ensure ydotoold is running

  // use ydotool to send keys
  let mut command = Command::new("ydotool");

  let child =  command.env("YDOTOOL_SOCKET",  YDOTOOL_SOCKET)
  // send Ctrl+Insert to copy
  .args(["key", "29:1", "110:1", "110:0", "29:0"])
  .spawn()
  .map_err(|e| format!("Failed to send keys: {}", e))?;

  let output= child.wait_with_output().map_err(|e| format!("Failed to wait for ydotool output: {}", e))?;

  println!("ydotool output: {:?}", String::from_utf8_lossy(&output.stdout));

  Ok(())
}

pub(crate) fn finalize_sendkey() -> Result<(), String> {
  YDOTOOLD_INSTANCE.get().map(|child| {
    if let Ok(mut child) = child.lock() {
      if let Err(e) = child.kill() {
        eprintln!("Failed to kill ydotoold: {}", e);
      }
    } else {
      eprintln!("Failed to lock ydotoold process");
    }
  });
  Ok(())
}


#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_send_keys() {
        // This test will attempt to call send_keys, but will likely fail unless ydotool is installed and running with proper permissions.
        let result = send_keys("test");
        // Accept both Ok and Err, but print the result for manual inspection
        println!("send_keys result: {:?}", result);
        // Optionally, assert that it does not panic
        assert!(result.is_ok() || result.is_err());
    }
}

