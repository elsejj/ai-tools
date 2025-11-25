<template>
  <div class="flex flex-col items-center w-full h-screen gap-2 p-2 bg-gray-100">
    <Tools />
    <div class="flex w-full">
      <InputText
        id="inputText"
        v-model="currentText"
        class="w-full flex-auto"
        placeholder="可以输入些什么然后回车，但更便捷的是在你当前软件中选中然后按下 Ctrl+Q"
        @keydown.enter="onEditSend"
      />
    </div>
    <LLMResult
      :text="llmResult"
      :format="currentTool?.responseFormat"
      :progress="llmProgress"
      :llm-name="llmName"
      :reason-text="llmReasonResult"
      class="flex-auto"
    >
    </LLMResult>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted } from "vue";
import Tools from "@renderer/components/Tools.vue";
import LLMResult from "@renderer/components/LLMResult.vue";
import { useSettings } from "@renderer/composables/settings";
import { useTools } from "@renderer/composables/tools";
import { OpenAI } from "openai";
import { ChatCompletionCreateParamsStreaming } from "openai/resources/index";
import {
  connectMcpClient,
  mcpCallTool,
  mcpListTools,
} from "@renderer/services/mcp";
import { Client as McpClient } from "@modelcontextprotocol/sdk/client/index.js";
import { removeQuote } from "@renderer/utils/llmResult";
import { register, unregisterAll } from "@tauri-apps/plugin-global-shortcut";
import { listen, UnlistenFn } from "@tauri-apps/api/event";

const currentText = ref("");
const currentImage = ref("");
const llmResult = ref("");
const llmReasonResult = ref("");
const llmProgress = ref("");
const llmName = ref("");
const settings = useSettings();
const tools = useTools();
let unListenFn: UnlistenFn | null = null;
const keydownAborter = new AbortController();

onMounted(() => {
  // const { ipcRenderer } = window.electron;
  // ipcRenderer.removeAllListeners("CtrlQ");
  // ipcRenderer.on("CtrlQ", onCtrlQ);
  document.addEventListener("keydown", onAppShortcut, {
    signal: keydownAborter.signal,
  });
  // ipcRenderer.postMessage("setProxy", settings.llm.proxy);

  unregisterAll();
  register("Ctrl+Q", onCtrlQ);

  listen("startup", () => {
    console.log("received startup event");
    onCtrlQ();
  }).then((unlisten) => {
    unListenFn = unlisten;
  });
});

onUnmounted(() => {
  // const { ipcRenderer } = window.electron
  // ipcRenderer.removeAllListeners('CtrlQ')
  // keydownAborter.abort()
  unregisterAll();
  if (unListenFn) {
    unListenFn();
  }
});

const currentTool = computed(() => {
  return tools.tools.find((tool) => tool.name === settings.tools.activated);
});

// watch(
//   () => settings.tools.activated,
//   invokeLLM
// )

async function onEditSend() {
  currentImage.value = "";
  await invokeLLM();
}

async function onCtrlQ() {
  currentImage.value = "";
  currentText.value = "";

  const image = await window.api.clipboard.readImageUrl(
    "image/jpeg",
    1568,
    1568
  );
  if (image) {
    currentImage.value = image;
    await invokeLLM();
    return;
  }
  const text = await window.api.clipboard.readText();
  if (text) {
    currentText.value = text;
    await invokeLLM();
    return;
  }

  const files = await window.api.getClipboardFiles();
  if (files && files.length > 0) {
    for (const fileName of files) {
      const content = await window.api.readFile(fileName, {
        maxWidth: 1568,
        maxHeight: 1568,
      });
      if (content.startsWith("data:image/")) {
        currentImage.value = content;
      } else {
        currentText.value = content;
      }
      await invokeLLM(fileName);
    }
  }
  console.log("files", files);
}

async function invokeLLM(
  inputFileName: string | undefined = undefined
): Promise<string> {
  if (!settings.llm.baseUrl || !settings.llm.model) {
    llmResult.value = "请先设置大模型";
    return "";
  }

  if (!currentTool.value) {
    llmResult.value = "请先选择一个工具";
    return "";
  }

  llmResult.value = "";
  llmReasonResult.value = "";
  let llmResponse = "";
  if (currentText.value) {
    llmResponse = await requestLLM(currentText.value);
  }
  if (currentImage.value) {
    llmResponse = await requestLLM(
      "用户的输入是一张图片，请根据以下的要求来处理图片",
      currentImage.value
    );
  }

  await doPostAction(llmResponse, inputFileName);
  return llmResponse;
}

async function requestLLM(
  userPrompt: string,
  imageUrl: string = ""
): Promise<string> {
  llmProgress.value = "正在生成...";

  const client = new OpenAI({
    apiKey: settings.llm.apiKey,
    baseURL: settings.llm.baseUrl,
    dangerouslyAllowBrowser: true,
  });

  // Use the tool's model if it's set, otherwise use the default logic
  let model = settings.llm.model;
  if (currentTool.value?.model) {
    model = currentTool.value.model;
  } else if (imageUrl && settings.llm.visionModel) {
    model = settings.llm.visionModel;
  }

  const modelReasoningEffort = currentTool.value?.reasoningEffort
    ? currentTool.value?.reasoningEffort
    : imageUrl && settings.llm.visionReasoningEffort
    ? settings.llm.visionReasoningEffort
    : settings.llm.reasoningEffort;
  const responseFormat = `请以 ${
    currentTool.value?.responseFormat || "markdown"
  } 格式返回结果`;

  const request: ChatCompletionCreateParamsStreaming = {
    model: model,
    messages: [],
    stream: true,
    stream_options: {
      include_usage: true,
    },
    response_format:
      currentTool.value?.responseFormat === "json"
        ? { type: "json_object" }
        : undefined,
  };

  if (modelReasoningEffort) {
    //@ts-ignore
    request.reasoning_effort = modelReasoningEffort;
  }

  if (imageUrl) {
    request.messages.push({
      role: "user",
      content: [
        {
          type: "text",
          text: `${userPrompt}\n${currentTool.value?.systemPrompt}\n${responseFormat}`,
        },
        {
          type: "image_url",
          image_url: {
            url: imageUrl,
          },
        },
      ],
    });
  } else {
    request.messages.push(
      {
        role: "system",
        content: `${currentTool.value?.systemPrompt}\n${responseFormat}`,
      },
      {
        role: "user",
        content: userPrompt,
      }
    );
  }

  return llmToolCall(client, request);
}

async function llmToolCall(
  llmClient: OpenAI,
  request: OpenAI.Chat.Completions.ChatCompletionCreateParamsStreaming
): Promise<string> {
  let mcpClient: McpClient | null = null;
  try {
    mcpClient = await connectMcpClient(currentTool.value?.mcp || "", "auto");
    if (mcpClient) {
      request.tools = await mcpListTools(mcpClient);
    }
  } catch (_e) {
    mcpClient = null;
  }

  const usage: OpenAI.CompletionUsage = {
    prompt_tokens: 0,
    completion_tokens: 0,
    total_tokens: 0,
  };

  const t1 = Date.now();

  let responseText = "";
  let reasonResponseText = "";
  while (true) {
    const stream = await llmClient.chat.completions.create(request);
    const tooCalls: Record<
      number,
      OpenAI.Chat.Completions.ChatCompletionChunk.Choice.Delta.ToolCall
    > = {};

    for await (const chunk of stream) {
      if (chunk.model?.length > 0 && llmName.value !== chunk.model) {
        llmName.value = chunk.model;
      }
      for (const choice of chunk.choices) {
        if (choice.delta.content) {
          llmProgress.value = `正在生成...`;
          responseText += choice.delta.content;
          llmResult.value = responseText
        }
        // @ts-ignore
        if (choice.delta.reasoning_content) {
          llmProgress.value = `正在思考...`;
          // @ts-ignore
          reasonResponseText += choice.delta.reasoning_content;
          llmReasonResult.value = reasonResponseText;
        }
        for (const toolCall of choice.delta.tool_calls || []) {
          llmProgress.value = `选择工具 ${toolCall.function?.name || ""}...`;
          const tc = tooCalls[toolCall.index];
          if (tc) {
            if (tc.function) {
              if (tc.function.arguments) {
                tc.function.arguments += toolCall.function?.arguments || "";
              } else {
                tc.function.arguments = toolCall.function?.arguments || "";
              }
            } else {
              tc.function = toolCall.function;
            }
          } else {
            tooCalls[toolCall.index] = toolCall;
          }
        }
      }
      if (chunk.usage) {
        usage.prompt_tokens += chunk.usage.prompt_tokens;
        usage.completion_tokens += chunk.usage.completion_tokens;
        usage.total_tokens += chunk.usage.total_tokens;
      }
    }
    if (Object.keys(tooCalls).length === 0 || !mcpClient) {
      break;
    }
    const toolMessage: OpenAI.Chat.Completions.ChatCompletionToolMessageParam[] =
      [];
    for (const toolCall of Object.values(tooCalls)) {
      llmProgress.value = `正在调用工具 ${toolCall.function?.name || ""}...`;
      if (toolCall.function && toolCall.function.name) {
        try {
          const result = await mcpCallTool(
            mcpClient,
            toolCall.function.name,
            toolCall.function.arguments || "{}"
          );
          toolMessage.push({
            role: "tool",
            tool_call_id: toolCall.id || "",
            content: result,
          });
        } catch (e) {
          llmProgress.value = `调用工具 ${toolCall.function?.name || ""} 失败`;
          const lines = [
            "# 错误",
            `${e}`,
            "# 函数",
            toolCall.function.name,
            "# 参数",
          ];
          if (toolCall.function.arguments) {
            const params = JSON.parse(toolCall.function.arguments);
            for (const key in params) {
              lines.push(`## ${key}`);
              lines.push("```");
              lines.push(params[key]);
              lines.push("```");
            }
          }
          llmResult.value = lines.join("\n");
          break;
        }
      }
    }
    if (toolMessage.length > 0) {
      const assistantMessage: OpenAI.Chat.Completions.ChatCompletionAssistantMessageParam =
        {
          role: "assistant",
          tool_calls: Object.values(tooCalls).map((toolCall) => {
            return {
              type: "function",
              id: toolCall.id || "",
              function: {
                name: toolCall.function?.name || "",
                arguments: toolCall.function?.arguments || "{}",
              },
            };
          }),
        };
      request.messages.push(assistantMessage);
      request.messages.push(...toolMessage);
    } else {
      break;
    }
  }

  const t2 = Date.now();
  const duration = ((t2 - t1) / 1000).toPrecision(2);
  llmProgress.value = `完成! 输入: ${usage.prompt_tokens} 生成: ${usage.completion_tokens} 耗时: ${duration}秒`;

  if (mcpClient) {
    await mcpClient.close();
  }

  return responseText;
}

async function doPostAction(
  llmResponse: string,
  inputFileName: string | undefined = undefined
) {
  let postAction = currentTool.value?.postAction || "none";

  switch (postAction) {
    case "copy":
      window.api.clipboard.writeText(llmResponse);
      break;
    case "save":
      let ext = ".txt";
      const responseFormat = currentTool.value?.responseFormat || "";
      switch (responseFormat) {
        case "markdown":
          ext = ".md";
          break;
        case "json":
          ext = ".json";
          break;
        case "html":
          ext = ".html";
          break;
        default:
          ext = ".txt";
          break;
      }
      if (ext !== ".txt") {
        llmResponse = removeQuote(llmResponse);
      }
      if (!inputFileName) {
        const now = new Date();
        const dateTimeString = `${now.getFullYear()}${
          now.getMonth() + 1
        }${now.getDate()}_${now.getHours()}${now.getMinutes()}${now.getSeconds()}`;
        const baseDir = window.api.llmResponsesDir;
        inputFileName = `${baseDir}/${dateTimeString}${ext}`;
        console.log("inputFileName", inputFileName);
      } else {
        inputFileName += ext;
      }
      window.api.saveTextFile(inputFileName, llmResponse);
      break;
    case "none":
      // do nothing
      break;
    default:
      console.warn("未知的后处理动作:", postAction);
      break;
  }
}

async function onAppShortcut(event: KeyboardEvent) {
  if (event.ctrlKey && event.key >= "1" && event.key <= "9") {
    const index = parseInt(event.key) - 1;
    if (index >= 0 && index < settings.tools.enabled.length) {
      settings.tools.activated = settings.tools.enabled[index];
      document.getElementById("inputText")?.focus();
    }
  }
}
</script>
