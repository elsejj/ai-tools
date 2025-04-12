import dbService from '@renderer/services/db'
import { AiTool, aiToolEqual, DEFAULT_TOOLS } from '@renderer/services/models'
import { defineStore } from 'pinia'
import { ref } from 'vue'





export const useTools = defineStore('tools', () => {

  const tools = ref<AiTool[]>([])

  /// load from the db
  async function load() {
    tools.value = await dbService.getTools( () => true)
    if (tools.value.length === 0) {
      tools.value = DEFAULT_TOOLS
      for (const tool of DEFAULT_TOOLS) {
        await dbService.addTool(tool)
      }
    }
  }

  async function add(tool: AiTool, update: boolean = false) {
    const index = tools.value.findIndex(t => t.name === tool.name)
    if (index !== -1) {
      if (aiToolEqual(tools.value[index], tool)) {
        return
      }
      if (update) {
        tools.value[index] = tool
        await dbService.setTool(tool.name, tool)
        return
      }
    } else {
      tools.value.push(tool)
      await dbService.addTool(tool)
    }
  }

  async function remove(name: string) {
    const index = tools.value.findIndex(t => t.name === name)
    if (index !== -1) {
      tools.value.splice(index, 1)
      await dbService.removeTool(t => t.name === name)
    }
  }

  async function update(name: string, tool: Partial<AiTool>) {
    const index = tools.value.findIndex(t => t.name === name)
    if (index !== -1) {
      tools.value[index] = { ...tools.value[index], ...tool }
      await dbService.setTool(name, tools.value[index])
    }
  }


  
  return {
    load,
    tools,
    add,
    update,
    remove,
  }
})

//type UseTools = ReturnType<typeof useTools>

