<template>
  <div class="w-full h-full overflow-hidden p-2 bg-surface-0 rounded-md">
    <div class="w-full flex items-center gap-2 justify-end">
      <div class="flex-auto text-sm text-gray-500 transition duration-500 ease-in-out">{{ progress }}</div>
      <Button label="复制纯文本" link @click="copyAsText" class="" />
      <Button label="复制富文本" link @click="copyAsHtml" class="" />
      <Button label="复制其中代码" link @click="copyAsCode" class="" />
    </div>
    <ScrollPanel class=" w-full h-full">
      <div ref="htmlNode" v-html="htmlSource" class="w-full wrap-break-word"></div>
    </ScrollPanel>
  </div>
</template>


<script lang="ts" setup>
import { computed, useTemplateRef } from 'vue'
import { Marked } from 'marked'
import { markedHighlight } from "marked-highlight"
import hljs from 'highlight.js'
import 'highlight.js/styles/github.css'
import jsonLang from 'highlight.js/lib/languages/json'
import xmlLang from 'highlight.js/lib/languages/xml'
import cssLang from 'highlight.js/lib/languages/css'
import javascriptLang from 'highlight.js/lib/languages/javascript'
import pythonLang from 'highlight.js/lib/languages/python'
import goLang from 'highlight.js/lib/languages/go'
import yamlLang from 'highlight.js/lib/languages/yaml'
import cppLang from 'highlight.js/lib/languages/cpp'
import shellLang from 'highlight.js/lib/languages/shell'
import typescriptLang from 'highlight.js/lib/languages/typescript'

import { useToast } from 'primevue/usetoast';



const props = defineProps({
  text: {
    type: String,
    default: '',
  },
  format: {
    type: String,
    default: 'markdown',
    required: false,
  },
  progress: {
    type: String,
    default: '',
  },
});

const htmlNode = useTemplateRef('htmlNode');
const toast = useToast();

const languages = {
  json: jsonLang,
  xml: xmlLang,
  css: cssLang,
  javascript: javascriptLang,
  python: pythonLang,
  go: goLang,
  yaml: yamlLang,
  cpp: cppLang,
  shell: shellLang,
  typescript: typescriptLang,
}

Object.entries(languages).forEach(([lang, langModule]) => {
  hljs.registerLanguage(lang, langModule);
});

const marked = new Marked(
  {
    gfm: true,
    breaks: true,
  },
  markedHighlight({
    highlight: (code, lang) => {
      if (lang && hljs.getLanguage(lang)) {
        return hljs.highlight(code, { language: lang }).value;
      }
      return code;
    },
  }),
);

function removeQuote(str: string) {
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

const htmlSource = computed(() => {
  switch (props.format) {
    case 'html':
      return removeQuote(props.text);
    default:
      return marked.parse(props.text);
  }
});


function copyAsText() {
  window.api.clipboard.writeText(props.text);
  toast.add({
    severity: 'success',
    summary: '复制成功',
    detail: '已复制到剪贴板,可以在文本编辑器中粘贴',
    life: 3000,
  })
}

function cssToString(css: CSSStyleDeclaration) {
  const keptStyles = ['background-color', 'color', 'width']
  const styles: string[] = []
  for (const style of keptStyles) {
    const value = css.getPropertyValue(style)
    if (value) {
      styles.push(`${style}: ${value}`)
    }
  }
  return styles.join('; ')
}


function addComputedStyle(node: HTMLElement) {
  const computedStyle = window.getComputedStyle(node)
  const cloned = node.cloneNode(false) as HTMLElement
  cloned.style.cssText = cssToString(computedStyle)
  for (const child of node.childNodes) {
    if (child.nodeType === Node.TEXT_NODE) {
      const textNode = document.createTextNode((child as Text).textContent || '')
      cloned.appendChild(textNode)
    } else {
      cloned.appendChild(addComputedStyle(child as HTMLElement))
    }
  }
  return cloned
}

async function copyAsHtml() {
  if (htmlNode.value === null) {
    return
  }
  const node = addComputedStyle(htmlNode.value)
  const html = node.innerHTML.replaceAll(/<br\/?>/g, '\n')
  window.api.clipboard.writeHTML(html);
  toast.add({
    severity: 'success',
    summary: '复制成功',
    detail: '已复制到剪贴板，可以在Word/Excel等中粘贴',
    life: 3000,
  })
}

function copyAsCode() {
  const code = removeQuote(props.text);
  if (code === '') {
    toast.add({
      severity: 'warn',
      summary: '复制失败',
      detail: '没有代码可供复制',
      life: 3000,
    })
    return
  }
  window.api.clipboard.writeText(code);
  toast.add({
    severity: 'success',
    summary: '复制成功',
    detail: '代码已复制到剪贴板',
    life: 3000,
  });
}

</script>