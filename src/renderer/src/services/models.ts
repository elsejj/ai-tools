

/// The tool model
export type AiTool = {
  /// The tool name
  name: string;
  /// The tool's system prompt send to the LLM
  systemPrompt: string;
  /// The mcp used in this tool
  mcp?: string;
  /// Response format
  responseFormat?: 'json' | 'html' | 'markdown';
}

export function aiToolEqual(a: AiTool, b: AiTool): boolean {
  return a.name === b.name && a.systemPrompt === b.systemPrompt && a.mcp === b.mcp && a.responseFormat === b.responseFormat;
}

export const DEFAULT_TOOLS: AiTool[] = [
  {
    "name": "翻译",
    "systemPrompt": "你是一个翻译器，请根据以下的规则对用户输入进行翻译\n\n- 首先识别用户的输入是中文或英文\n- 然后对进行 中->英 或 英->中 的翻译\n- 翻译的结果需要尽可能的符合目标语言的语法习惯。\n- 你仅需要输出翻译后的结果，无需其他的解释",
    "responseFormat": "markdown"
  },
  {
    "name": "答疑",
    "systemPrompt": "请根据用户的输入，给出专业的解答",
    "responseFormat": "markdown"
  },
  {
    "name": "表格提取",
    "systemPrompt":`Please analyze this image and extract any tables as HTML tables. Handle line wraps in cells carefully, using '<br/>' when needed.
You should try your best to keep the origin table structure, content, format, and alignment as much as possible. The key points are:
 
- colspan and rowspan
- bold, italic, underline, strikethrough
- when the table has no white background color, it should set to the 'bgcolor' attribute of the 'table' 'tr' 'th' 'td' tag
- table borders should be maintained using the 'border' attribute
- 'table' tag should have the 'easy-table' class`,
    "responseFormat": "html",
  },
  {
    "name": "Bash",
    "systemPrompt": "你工作在linux下，请根据用户的输入，编写相应的 `Bash` 命令."
  },
  {
    "name": "股票分析",
    "systemPrompt": "你是一个专业的投资顾问，请根据用户的输入，推断出股票代码，然后调用相关的工具，进行走势分析。\n请在分析时标明当前的数据日期\n你应该应用你的金融学知识，着重对数据进行专业解读。",
    "responseFormat": "markdown",
    "mcp": "http://82.156.17.205/cnstock/sse"
  }
]

/// The runtime configuration of the tools
export type ToolsConfig = {
  /// The list of tools id that are enabled
  enabled: string[];
  /// The tool id that is currently activated
  activated: string;
}

/// The configuration of LLM
export type LLMConfig = {
  /// The API key for the LLM provider
  apiKey: string;
  /// The base URL for the LLM provider
  baseUrl: string;
  /// The LLM model
  model: string;
  /// The vision model
  visionModel?: string;
  /// The LLM provider
  provider?: string;
}


export type AllConfig = {
  tools: ToolsConfig;
  llm: LLMConfig;
}

export type Config<T extends keyof AllConfig> = {
  /// The name of the config
  name: T;
  /// The value of the config
  value: AllConfig[T];
}