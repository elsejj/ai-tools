
import os from 'node:os'
import { spawnSync } from 'node:child_process'


const platform = os.platform()

switch (platform) {
  case 'win32':
    spawnSync('npm', ['run', 'build:win'], { stdio: 'inherit' })
    break
  case 'linux':
    spawnSync('npm', ['run', 'build:linux'], { stdio: 'inherit' })
    break
  case 'darwin':
    spawnSync('npm', ['run', 'build:mac'], { stdio: 'inherit' })
    break
  default:
    console.error(`Unsupported platform: ${platform}`)
    process.exit(1)
}