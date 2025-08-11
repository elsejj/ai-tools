import Dexie, { type EntityTable } from 'dexie'
import { AiTool, AllConfig, Config } from './models'

type AnyConfig = {
  name: string
  value: any
}

const db = new Dexie('AiTools') as Dexie & {
  tools: EntityTable<
    AiTool,
    'name' // primary key "id" (for the typings only)
  >
  config: EntityTable<
    AnyConfig,
    'name' // primary key "name" for the config
  >
}

// Schema declaration:
db.version(1).stores({
  tools: 'name', // primary key "id" (for the runtime!)
  config: 'name' // primary key "name" for the config
})

class DbService {
  getTools(filter: (tool: AiTool) => boolean): Promise<AiTool[]> {
    return db.tools.filter(filter).toArray()
  }

  getTool(name: string): Promise<AiTool | undefined> {
    return db.tools.get(name)
  }

  setTool(name: string, tool: Partial<AiTool>): Promise<number> {
    return db.tools.update(name, tool)
  }

  addTool(tool: AiTool): Promise<string> {
    return db.tools.add(tool)
  }

  removeTool(filter: (tool: AiTool) => boolean): Promise<number> {
    return db.tools.filter(filter).delete()
  }

  async getConfig<T extends keyof AllConfig>(name: T): Promise<AllConfig[T] | undefined> {
    const record = await (db.config.get(name) as Promise<AnyConfig | undefined>)
    if (record) {
      return record.value as AllConfig[T]
    }
    return undefined
  }

  setConfig<T extends keyof AllConfig>(name: T, value: AllConfig[T]): Promise<string> {
    return db.config.put({ name, value } as Config<T>)
  }
}

const dbService = new DbService()
export default dbService
