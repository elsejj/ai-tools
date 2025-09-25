const { mkdir, copyFile } = require('node:fs')

mkdir('dist', { recursive: true }, (err) => {
  if (err) throw err
  console.log('Directory created successfully')
})

const files = [
  'index.js',
  'index.d.ts',
  'package.json',
  'sendkey.linux-x64-gnu.node',
  'sendkey.win32-x64-msvc.node'
]

files.forEach((file) => {
  copyFile(`./${file}`, `./dist/${file}`, (err) => {
    if (err) throw err
    console.log(`${file} was copied to dist/`)
  })
})
