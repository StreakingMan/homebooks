/**
 * DeepSeek AI 客户端封装
 * 提供对话和Embedding功能
 */

interface Message {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
}

interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

interface Tool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, any>;
  };
}

interface ChatOptions {
  messages: Message[];
  tools?: Tool[];
  temperature?: number;
  max_tokens?: number;
}

interface ChatResponse {
  id: string;
  choices: Array<{
    message: {
      role: string;
      content: string | null;
      tool_calls?: ToolCall[];
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * 调用DeepSeek Chat API
 */
export async function callDeepSeek(options: ChatOptions): Promise<ChatResponse> {
  const config = useRuntimeConfig();
  const apiKey = config.deepseekApiKey;

  if (!apiKey) {
    throw createError({
      statusCode: 500,
      message: 'DeepSeek API Key not configured',
    });
  }

  try {
    const response = await $fetch<ChatResponse>('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: {
        model: 'deepseek-chat',
        messages: options.messages,
        tools: options.tools,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.max_tokens ?? 2000,
      },
    });

    return response;
  } catch (error: any) {
    console.error('DeepSeek API调用失败:', error);
    throw createError({
      statusCode: error.statusCode || 500,
      message: `AI服务调用失败: ${error.message || '未知错误'}`,
    });
  }
}

/**
 * 获取文本的Embedding向量
 * 使用硅基流动的OpenAI兼容API
 */
export async function getEmbedding(text: string): Promise<number[]> {
  const config = useRuntimeConfig();
  const apiKey = config.siliconflowApiKey;

  if (!apiKey) {
    throw createError({
      statusCode: 500,
      message: 'SiliconFlow API Key not configured',
    });
  }

  try {
    const textPreview = text.length > 50 ? text.substring(0, 50) + '...' : text;
    console.log(`🌐 [SiliconFlow] 调用Embedding API: "${textPreview}"`);

    const response = await $fetch<{
      data: Array<{ embedding: number[] }>;
      usage: { total_tokens: number };
    }>('https://api.siliconflow.cn/v1/embeddings', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: {
        model: 'Qwen/Qwen3-Embedding-8B', // 阿里云Qwen3 Embedding模型
        input: text,
      },
    });

    console.log(`✅ [SiliconFlow] Embedding成功，消耗tokens: ${response.usage.total_tokens}`);
    return response.data[0].embedding;
  } catch (error: any) {
    console.error('❌ [SiliconFlow] Embedding调用失败:', error);
    throw createError({
      statusCode: error.statusCode || 500,
      message: `Embedding服务调用失败: ${error.message || '未知错误'}`,
    });
  }
}

/**
 * 批量获取Embedding向量
 */
export async function getBatchEmbeddings(texts: string[]): Promise<number[][]> {
  const config = useRuntimeConfig();
  const apiKey = config.siliconflowApiKey;

  if (!apiKey) {
    throw createError({
      statusCode: 500,
      message: 'SiliconFlow API Key not configured',
    });
  }

  try {
    console.log(`🌐 [SiliconFlow] 批量调用Embedding API，共 ${texts.length} 条文本`);

    const response = await $fetch<{
      data: Array<{ embedding: number[]; index: number }>;
      usage: { total_tokens: number };
    }>('https://api.siliconflow.cn/v1/embeddings', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: {
        model: 'Qwen/Qwen3-Embedding-8B',
        input: texts,
      },
    });

    console.log(`✅ [SiliconFlow] 批量Embedding成功，消耗tokens: ${response.usage.total_tokens}`);

    // 按index排序确保顺序正确
    return response.data.sort((a, b) => a.index - b.index).map((item) => item.embedding);
  } catch (error: any) {
    console.error('❌ [SiliconFlow] 批量Embedding调用失败:', error);
    throw createError({
      statusCode: error.statusCode || 500,
      message: `批量Embedding服务调用失败: ${error.message || '未知错误'}`,
    });
  }
}
