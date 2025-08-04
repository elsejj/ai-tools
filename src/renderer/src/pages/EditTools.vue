<template>
  <div class="p-2 flex flex-col gap-2">
    <div class="w-full gap-2 p-2 bg-primary-700 rounded-md flex justify-end items-center">
      <Button
        label="导入"
        severity="info"
        text
        @click="importTools"
        class="text-surface-200 hover:text-primary-700"
      />
      <Button
        label="导出所有"
        severity="info"
        text
        @click="exportTools()"
        class="text-surface-200 hover:text-primary-700"
      />
      <Button
        label="导出当前"
        severity="info"
        text
        @click="exportTools(tool.name)"
        class="text-surface-200 hover:text-primary-700"
      />
      <span class="flex-auto"></span>
      <Button
        label="返回"
        @click="$router.back()"
        link
        severity="secondary"
        class="text-surface-200"
      />
    </div>
    <div class="grid grid-cols-[5rem_1fr] items-center w-full gap-2 p-2 bg-surface-100 rounded-md">
      <div>选择工具</div>
      <Select
        :options="toolsList"
        filter
        showClear
        placeholder="选择工具"
        optionLabel="name"
        class="w-full"
        @change="onToolSelected"
      >
        <template #option="{ option }">
          <span :class="option.enabled ? 'text-primary' : 'text-surface'">{{ option.name }}</span>
        </template>
      </Select>
      <div class="font-bold">名称</div>
      <InputText v-model="tool.name" class="w-full" placeholder="工具的名称" />
      <div class="font-bold">系统提词</div>
      <Textarea
        v-model="tool.systemPrompt"
        class="w-full"
        placeholder="请描述该工具的功能"
        rows="8"
      />
      <div class="font-bold">用户提词<br />模板</div>
      <Textarea
        v-model="tool.userPrompt"
        class="w-full"
        placeholder="用户提词的模板，其中的变量{input}会被替换成实际的输入，为空或不包含变量则会被忽略"
        rows="4"
      />
      <div>输出格式</div>
      <div class="flex gap-2">
        <RadioButton v-model="tool.responseFormat" name="text" value="markdown" class="" />
        <label for="text" class="">文本</label>
        <RadioButton v-model="tool.responseFormat" name="html" value="html" class="" />
        <label for="html" class="">HTML</label>
        <RadioButton v-model="tool.responseFormat" name="json" value="json" class="" />
        <label for="json" class="">JSON</label>
      </div>
      <div>后置操作</div>
      <div class="flex gap-2">
        <RadioButton v-model="tool.postAction" name="none" value="none" class="" />
        <label for="none" class="">无</label>
        <RadioButton v-model="tool.postAction" name="copy" value="copy" class="" />
        <label for="copy" class="">复制</label>
        <RadioButton v-model="tool.postAction" name="save" value="save" class="" />
        <label for="save" class="">保存</label>
      </div>
      <div>MCP</div>
      <InputText v-model="tool.mcp" class="w-full" placeholder="MCP服务的地址" />
      <div>MCP提词</div>
      <Select
        :options="mcpPrompts"
        class="w-full"
        showClear
        optionLabel="name"
        placeholder="选择MCP提词"
        @change="onMcpPromptSelected"
      />
      <div>启用</div>
      <Checkbox v-model="tool.enabled" class="w-full" binary />
    </div>
    <div class="flex justify-end items-center w-full gap-2 p-2">
      <Button label="删除" @click="deleteTool" severity="danger" />
      <div class="flex-auto"></div>
      <Button label="新建" @click="createTool" severity="info" />
      <Button label="保存" @click="saveTool" />
    </div>
    <div class="flex justify-end items-center w-full gap-2 p-2 text-red-400">
      {{ errMsg }}
    </div>
  </div>
</template>

<script lang="ts" setup>
import { AiTool } from '@renderer/services/models'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useTools } from '@renderer/composables/tools'
import { useSettings } from '@renderer/composables/settings'
import { useRoute } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { Client as McpClient } from '@modelcontextprotocol/sdk/client/index.js'
import { connectMcpClient } from '@renderer/services/mcp'

const tool = ref<AiTool & { enabled: boolean }>({
  name: '',
  systemPrompt: '',
  userPrompt: '',
  mcp: '',
  responseFormat: 'markdown',
  postAction: 'none',
  enabled: false
})
const errMsg = ref<string>('')
const tools = useTools()
const settings = useSettings()
const route = useRoute()
const toast = useToast()
const mcpClient = ref<McpClient | null>(null)

const toolsList = computed(() => {
  return tools.tools
    .map((tool) => {
      return {
        name: tool.name,
        enabled: settings.tools.enabled.includes(tool.name)
      }
    })
    .sort((a, b) => {
      return a.name.localeCompare(b.name)
    })
})

const mcpPrompts = ref<{ name: string; prompt?: string; description?: string }[]>([])

onMounted(() => {
  const name = route.params.name as string
  if (name) {
    const toolData = tools.tools.find((tool) => tool.name === name)
    if (toolData) {
      tool.value = {
        ...toolData,
        enabled: settings.tools.enabled.includes(toolData.name)
      }
    }
  }
})

onBeforeUnmount(() => {
  console.log('close mcp client')
  if (mcpClient.value) {
    mcpClient.value.close()
  }
})

// list prompts when mcp changes
watch(
  () => tool.value.mcp,
  async (newVal) => {
    mcpPrompts.value = []
    try {
      if (newVal) {
        if (mcpClient.value) {
          mcpClient.value.close()
        }
        mcpClient.value = await connectMcpClient(newVal, 'sse')
        if (!mcpClient.value) {
          console.debug('connect mcp failed')
          return
        }
        const prompts = await mcpClient.value.listPrompts()
        mcpPrompts.value = prompts.prompts
          .map((prompt) => {
            return {
              name: prompt.name,
              description: prompt.description
            }
          })
          .sort((a, b) => {
            return a.name.localeCompare(b.name)
          })
      }
    } catch (e) {
      console.debug('connect mcp error', e)
      mcpClient.value = null
    }
  }
)

function onToolSelected(event: any) {
  const selectedTool = event.value
  if (selectedTool?.name) {
    const toolData = tools.tools.find((tool) => tool.name === selectedTool?.name)
    if (toolData) {
      tool.value = {
        ...toolData,
        enabled: settings.tools.enabled.includes(toolData.name)
      }
    }
  } else {
    createTool()
  }
}

async function onMcpPromptSelected(event: any) {
  const selectedPrompt = event.value
  if (selectedPrompt?.name) {
    if (selectedPrompt?.prompt) {
      tool.value.systemPrompt = selectedPrompt.prompt
    } else {
      if (mcpClient.value) {
        const prompt = await mcpClient.value.getPrompt({
          name: selectedPrompt.name
        })
        if (prompt) {
          tool.value.systemPrompt = prompt.messages
            .map((message) => {
              return message.content.text
            })
            .join('\n')
          selectedPrompt.prompt = tool.value.systemPrompt
        }
      }
    }
  }
}

function createTool() {
  tool.value = {
    name: '',
    systemPrompt: '',
    userPrompt: '',
    mcp: '',
    responseFormat: 'markdown',
    postAction: 'none',
    enabled: false
  }
}

async function deleteTool() {
  await tools.remove(tool.value.name)
  const index = settings.tools.enabled.indexOf(tool.value.name)
  if (index !== -1) {
    settings.tools.enabled.splice(index, 1)
  }
}

async function saveTool() {
  errMsg.value = ''
  if (!tool.value.name) {
    errMsg.value = '工具名称不能为空'
    return
  }
  if (!tool.value.systemPrompt) {
    errMsg.value = '提词不能为空'
    return
  }
  const name = route.params.name as string
  if (name) {
    await tools.update(name, toAiTool(tool.value))
  } else {
    await tools.add(toAiTool(tool.value), true)
  }
  if (tool.value.enabled) {
    if (!settings.tools.enabled.includes(tool.value.name)) {
      settings.tools.enabled.push(tool.value.name)
    }
  } else {
    const index = settings.tools.enabled.indexOf(tool.value.name)
    if (index !== -1) {
      settings.tools.enabled.splice(index, 1)
    }
  }

  toast.add({
    severity: 'success',
    summary: '保存成功',
    detail: '工具已成功保存',
    life: 3000
  })
}

function toAiTool(tool: any): AiTool {
  return {
    name: tool.name,
    systemPrompt: tool.systemPrompt,
    userPrompt: tool.userPrompt,
    postAction: tool.postAction,
    mcp: tool.mcp,
    responseFormat: tool.responseFormat
  }
}

async function importTools() {
  const body = await navigator.clipboard.readText()
  if (!body) {
    toast.add({
      severity: 'error',
      summary: '导入失败',
      detail: '剪贴板中没有内容',
      life: 3000
    })
    return
  }

  let count = 0
  try {
    count = await tools.importTools(body)
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: '导入失败',
      detail: (error as Error).message,
      life: 3000
    })
    return
  }
  toast.add({
    severity: 'success',
    summary: '导入成功',
    detail: `已成功导入 ${count} 个工具`,
    life: 3000
  })
}

async function exportTools(toolName?: string) {
  try {
    const body = await tools.exportTools(toolName)
    await navigator.clipboard.writeText(body)
    toast.add({
      severity: 'success',
      summary: '导出成功',
      detail: '工具已成功导出到剪贴板',
      life: 3000
    })
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: '导出失败',
      detail: (error as Error).message,
      life: 3000
    })
  }
}
</script>
