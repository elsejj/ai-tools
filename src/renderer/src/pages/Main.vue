<template>
  <div class="flex flex-col items-center w-full  h-screen gap-2 p-2 bg-gray-100">
    <Tools />
    <div class="flex w-full">
      <InputText v-model="currentText" class="w-full flex-auto" placeholder="可以输入些什么然后回车，但更便捷的是在你当前软件中选中然后按下 Ctrl+Q"
        @keydown.enter="onEditSend" />
    </div>
    <LLMResult :text="llmResult" :format="currentTool?.responseFormat" class="flex-auto"></LLMResult>

  </div>
</template>

<script setup lang="ts">


import { ref, onMounted, watch, computed } from "vue";
import Tools from '@renderer/components/Tools.vue';
import LLMResult from '@renderer/components/LLMResult.vue';
import { useSettings } from '@renderer/composables/settings';
import { useTools } from '@renderer/composables/tools';
import { OpenAI } from 'openai';
import { ChatCompletionCreateParamsStreaming } from "openai/resources/index";
import { connectMcpClient, mcpCallTool, mcpListTools } from "@renderer/services/mcp";
import { Client as McpClient } from "@modelcontextprotocol/sdk/client/index";

const currentText = ref('');
const currentImage = ref('');
const llmResult = ref('');
const settings = useSettings();
const tools = useTools();


onMounted(() => {
  const { ipcRenderer } = window.electron;
  ipcRenderer.removeAllListeners('CtrlQ');
  ipcRenderer.on('CtrlQ', onCtrlQ);
});


const currentTool = computed(() => {
  return tools.tools.find((tool) => tool.name === settings.tools.activated);
})


watch(
  () => settings.tools.activated,
  invokeLLM
)

async function invokeLLM() {
  if (currentText.value) {
    await requestLLM(currentText.value)
  }
  if (currentImage.value) {
    await requestLLM('用户的输入是一张图片，请根据以下的要求来处理图片', currentImage.value)
  }
}

async function onEditSend() {
  currentImage.value = ''
  await invokeLLM()
}

async function onCtrlQ() {

  currentImage.value = ''
  currentText.value = ''

  const image = window.api.clipboard.readImage();
  if (image && !image.isEmpty()) {
    const { width, height } = image.getSize()
    const MAX_IMAGE_SIZE = 1568
    let scale = MAX_IMAGE_SIZE / Math.max(width, height);
    if (scale > 1) {
      scale = 1;
    }
    const dataUrl = image.toDataURL({ scaleFactor: scale, })
    currentImage.value = dataUrl
    await invokeLLM()
    return
  }
  const text = window.api.clipboard.readText();
  if (text) {
    currentText.value = text
    await invokeLLM()
    return
  }
}

async function requestLLM(userPrompt: string, imageUrl: string = '') {

  if (!settings.llm.apiKey || !settings.llm.baseUrl || !settings.llm.model) {
    llmResult.value = '请先设置大模型'
    return
  }

  if (!currentTool.value) {
    llmResult.value = '请先选择一个工具'
    return
  }

  llmResult.value = '正在请求...'

  const client = new OpenAI({
    apiKey: settings.llm.apiKey,
    baseURL: settings.llm.baseUrl,
    dangerouslyAllowBrowser: true,
  });


  const model = imageUrl && settings.llm.visionModel ? settings.llm.visionModel : settings.llm.model


  const responseFormat = `请以 ${currentTool.value.responseFormat || "markdown"} 格式返回结果`

  const request: ChatCompletionCreateParamsStreaming = {
    model,
    messages: [],
    stream: true,
  }

  if (imageUrl) {
    request.messages.push({
      role: 'user',
      content: [
        {
          type: 'text',
          text: `${userPrompt}\n${currentTool.value.systemPrompt}\n${responseFormat}`,
        },
        {
          type: 'image_url',
          image_url: {
            url: imageUrl,
          }
        }
      ]
    })
  } else {
    request.messages.push(
      {
        role: 'system',
        content: `${currentTool.value.systemPrompt}\n${responseFormat}`,
      },
      {
        role: 'user',
        content: userPrompt,
      }
    )
  }

  await llmToolCall(client, request)

}

async function llmToolCall(llmClient: OpenAI, request: OpenAI.Chat.Completions.ChatCompletionCreateParamsStreaming) {

  let mcpClient: McpClient | null = null
  try {
    mcpClient = await connectMcpClient(currentTool.value?.mcp || '', 'sse')
    if (mcpClient) {
      request.tools = await mcpListTools(mcpClient)
    }
  } catch (_e) {
    mcpClient = null
  }


  llmResult.value = '';
  while (true) {

    const stream = await llmClient.chat.completions.create(request)
    const tooCalls: Record<number, OpenAI.Chat.Completions.ChatCompletionChunk.Choice.Delta.ToolCall> = {}

    for await (const chunk of stream) {
      for (const choice of chunk.choices) {
        if (choice.delta.content) {
          llmResult.value += choice.delta.content;
        }
        for (const toolCall of choice.delta.tool_calls || []) {
          const tc = tooCalls[toolCall.index];
          if (tc) {
            if (tc.function) {
              tc.function.arguments += toolCall.function?.arguments || '';
            } else {
              tc.function = toolCall.function
            }
          } else {
            tooCalls[toolCall.index] = toolCall;
          }
        }
      }
    }
    if (Object.keys(tooCalls).length === 0 || !mcpClient) {
      break
    }
    const toolMessage: OpenAI.Chat.Completions.ChatCompletionToolMessageParam[] = []
    for (const toolCall of Object.values(tooCalls)) {
      if (toolCall.function && toolCall.function.name) {
        const result = await mcpCallTool(mcpClient, toolCall.function.name, toolCall.function.arguments || '{}');
        toolMessage.push({
          role: 'tool',
          tool_call_id: toolCall.id || '',
          content: result
        })
      }
    }
    if (toolMessage.length > 0) {
      const assistantMessage: OpenAI.Chat.Completions.ChatCompletionAssistantMessageParam = {
        role: 'assistant',
        tool_calls: Object.values(tooCalls).map((toolCall) => {
          return {
            type: 'function',
            id: toolCall.id || '',
            function: {
              name: toolCall.function?.name || '',
              arguments: toolCall.function?.arguments || '{}',
            }
          }
        })
      }
      request.messages.push(assistantMessage)
      request.messages.push(...toolMessage)
    } else {
      break
    }
  }

  if (mcpClient) {
    await mcpClient.close();
  }
}


</script>