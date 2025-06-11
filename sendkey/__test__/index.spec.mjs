import test from 'ava'

import { getClipboardFiles } from '../index.js'

test('getClipboardFiles', async (t) => {
  const files = getClipboardFiles()
  console.log(files)
  t.true(Array.isArray(files))
})
