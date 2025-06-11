

export function removeQuote(str: string) {
  let startPos = str.indexOf('```')
  if (startPos === -1) {
    return str
  }
  const brPos = str.indexOf('\n', startPos)
  if (brPos === -1) {
    startPos += 3
  } else {
    startPos = brPos + 1
  }
  const endPos = str.indexOf('```', startPos)
  if (endPos === -1) {
    return str.substring(startPos)
  }
  return str.substring(startPos, endPos)
}

export function removeFirstMarkdownQuote(str: string) {
  if (str.startsWith('```')) {
    const startPos = str.indexOf('\n') + 1
    const endPos = str.lastIndexOf('```')
    if (endPos !== -1) {
      return str.substring(startPos, endPos).trim()
    }
  }
  return str.trim()
}