<template>
  <div
    class="w-full h-full overflow-hidden p-2 bg-surface-0 rounded-md flex flex-col gap-2"
  >
    <div class="flex-none w-full h-10 flex items-center gap-2 justify-end">
      <div
        class="flex-auto text-sm text-gray-500 transition duration-500 ease-in-out p-1"
      >
        {{ progress }}
      </div>
      <div class="text-sm text-primary-700">
        {{ llmName }}
      </div>
      <Button
        v-if="props.text && props.reasonText"
        icon="icon-[lucide-lab--coins-exchange] w-6 h-6"
        outlined
        @click="toggleReason"
        v-tool-tip="'查看思考过程'"
      />
      <Popover ref="op">
        <div class="w-[600px] max-h-[400px] overflow-y-auto p-2">
          <div v-html="reasonHtmlSource" class="wrap-break-word"></div>
        </div>
      </Popover>
      <Button
        icon="icon-[lucide-lab--copy-type] w-6 h-6"
        outlined
        @click="copyAsText"
        v-tool-tip="'复制为文本'"
      />
      <Button
        icon="icon-[lucide-lab--copy-text] w-6 h-6"
        outlined
        @click="copyAsHtml"
        v-tool-tip="'复制为HTML'"
      />
      <Button
        icon="icon-[lucide-lab--copy-code] w-6 h-6"
        outlined
        @click="copyAsCode"
        v-tool-tip="'复制代码'"
      />
      <Button
        icon="icon-[lucide-lab--copy-image] w-6 h-6"
        outlined
        @click="copyAsImage"
        v-tool-tip="'复制为图片'"
      />
    </div>
    <ScrollPanel class="w-full h-[90%]">
      <div class="h-6"></div>
      <div id="llm-result">
        <div
          ref="htmlNode"
          v-html="htmlSource"
          class="w-full wrap-break-word px-2"
        ></div>
        <div class="text-right" :style="{ visibility: showFooter }">
          <span class="ml-2">来自</span>
          <span class="text-primary">{{ props.llmName }}</span>
          <span>在</span>
          <span class="text-primary font-bold">ai-tools</span>
          <span>的回答</span>
        </div>
      </div>
      <div ref="bottomNode"></div>
    </ScrollPanel>
  </div>
</template>

<script lang="ts" setup>
import { computed, onUpdated, ref, useTemplateRef } from "vue";
import { Marked } from "marked";
import { markedHighlight } from "marked-highlight";
import markedKatex from "marked-katex-extension";
import hljs from "highlight.js";
import "highlight.js/styles/github.css";
import jsonLang from "highlight.js/lib/languages/json";
import xmlLang from "highlight.js/lib/languages/xml";
import cssLang from "highlight.js/lib/languages/css";
import javascriptLang from "highlight.js/lib/languages/javascript";
import pythonLang from "highlight.js/lib/languages/python";
import goLang from "highlight.js/lib/languages/go";
import yamlLang from "highlight.js/lib/languages/yaml";
import cppLang from "highlight.js/lib/languages/cpp";
import shellLang from "highlight.js/lib/languages/shell";
import typescriptLang from "highlight.js/lib/languages/typescript";
import { toPng } from "html-to-image";

import { useToast } from "primevue/usetoast";
import {
  removeFirstMarkdownQuote,
  removeQuote,
} from "@renderer/utils/llmResult";

const props = defineProps({
  text: {
    type: String,
    default: "",
  },
  format: {
    type: String,
    default: "markdown",
    required: false,
  },
  progress: {
    type: String,
    default: "",
  },
  llmName: {
    type: String,
    default: "",
  },
  reasonText: {
    type: String,
    default: "",
  },
});

const htmlNode = useTemplateRef("htmlNode");
const toast = useToast();
const bottomNode = useTemplateRef("bottomNode");
const showFooter = ref<"hidden" | "visible">("hidden");
const op = ref();

function toggleReason(event: Event) {
  op.value.toggle(event);
}

onUpdated(() => {
  if (bottomNode.value) {
    bottomNode.value.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }
});

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
};

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
  markedKatex({ nonStandard: true, output: "mathml" })
);

const htmlSource = computed(() => {
  const content = props.text || props.reasonText;
  switch (props.format) {
    case "html":
      return removeQuote(content);
    default:
      return marked.parse(removeFirstMarkdownQuote(content));
  }
});

const reasonHtmlSource = computed(() => {
  return marked.parse(removeFirstMarkdownQuote(props.reasonText));
});

function copyAsText() {
  window.api.clipboard.writeText(props.text);
  toast.add({
    severity: "success",
    summary: "复制成功",
    detail: "已复制到剪贴板,可以在文本编辑器中粘贴",
    life: 3000,
  });
}

function cssToString(css: CSSStyleDeclaration) {
  const keptStyles = ["background-color", "color", "width"];
  const styles: string[] = [];
  for (const style of keptStyles) {
    const value = css.getPropertyValue(style);
    if (value) {
      styles.push(`${style}: ${value}`);
    }
  }
  return styles.join("; ");
}

function addComputedStyle(node: HTMLElement) {
  const computedStyle = window.getComputedStyle(node);
  const cloned = node.cloneNode(false) as HTMLElement;
  cloned.style.cssText = cssToString(computedStyle);
  for (const child of node.childNodes) {
    if (child.nodeType === Node.TEXT_NODE) {
      const textNode = document.createTextNode(
        (child as Text).textContent || ""
      );
      cloned.appendChild(textNode);
    } else {
      cloned.appendChild(addComputedStyle(child as HTMLElement));
    }
  }
  return cloned;
}

async function copyAsHtml() {
  if (htmlNode.value === null) {
    return;
  }
  const node = addComputedStyle(htmlNode.value);
  const html = node.innerHTML.replaceAll(/<br\/?>/g, "\n");
  window.api.clipboard.writeHTML(html);
  toast.add({
    severity: "success",
    summary: "复制成功",
    detail: "已复制到剪贴板，可以在Word/Excel等中粘贴",
    life: 3000,
  });
}

function copyAsCode() {
  const code = removeQuote(props.text);
  if (code === "") {
    toast.add({
      severity: "warn",
      summary: "复制失败",
      detail: "没有代码可供复制",
      life: 3000,
    });
    return;
  }
  window.api.clipboard.writeText(code);
  toast.add({
    severity: "success",
    summary: "复制成功",
    detail: "代码已复制到剪贴板",
    life: 3000,
  });
}

async function copyAsImage() {
  const node = document.getElementById("llm-result");
  if (node === null) {
    return;
  }

  const fontSize = node.style.fontSize;
  const padding = node.style.padding;
  const lineHeight = node.style.lineHeight;
  showFooter.value = "visible";

  node.style.fontSize = "20px";
  node.style.padding = "4rem 1rem 2rem 2rem";
  node.style.lineHeight = "28px";
  const dataUrl = await toPng(node, {
    backgroundColor: "#ffffff",
    quality: 1,
    pixelRatio: 2,
  });

  node.style.fontSize = fontSize;
  node.style.padding = padding;
  node.style.lineHeight = lineHeight;
  showFooter.value = "hidden";

  window.api.copyImage(dataUrl);

  toast.add({
    severity: "success",
    summary: "复制成功",
    detail: "图片已复制到剪贴板",
    life: 3000,
  });
}
</script>
