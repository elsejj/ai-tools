import dbService from "@renderer/services/db"
import { DEFAULT_TOOLS, LLMConfig, ToolsConfig } from "@renderer/services/models"
import { defineStore } from "pinia"
import { ref, toRaw, watch } from "vue"


export const useSettings = defineStore('settings', () => {

  const tools = ref<ToolsConfig>({
    enabled: [],
    activated: '',
  })

  const llm = ref<LLMConfig>({
    apiKey: '',
    baseUrl: '',
    model: '',
  })

  async function load() {
    const toolsConfig = await dbService.getConfig('tools')
    if (toolsConfig) {
      tools.value = toolsConfig
    }else{
      tools.value = {
        enabled: DEFAULT_TOOLS.map(tool => tool.name),
        activated: DEFAULT_TOOLS[0].name,
      }
      await dbService.setConfig('tools', toRaw(tools.value))
    }

    // automatically save the tools config to the db
    watch(tools, async () => {
      await dbService.setConfig('tools', toRaw(tools.value))
    }, { deep: true })

    const llmConfig = await dbService.getConfig('llm')
    if (llmConfig) {
      llm.value = llmConfig
    }

    watch(llm, async () => {
      await dbService.setConfig('llm', toRaw(llm.value))
    }, { deep: true })
  }

  return {
    tools,
    llm,
    load,
  }
})
