/**
 * AI聊天接口
 * 处理用户消息，调用DeepSeek AI，执行工具函数
 */
import { callDeepSeek } from '../../utils/ai-client';
import { aiToolsDefinition, executeToolFunction } from '../../utils/ai-tools';

interface Message {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_calls?: any[];
  tool_call_id?: string;
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { messages } = body as { messages: Message[] };

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    throw createError({
      statusCode: 400,
      message: '无效的消息格式',
    });
  }

  try {
    // 添加系统提示词（如果第一条不是system消息）
    const messagesWithSystem = [...messages];
    if (messagesWithSystem[0]?.role !== 'system') {
      messagesWithSystem.unshift({
        role: 'system',
        content: `你是一个智能书墙管理助手，帮助用户管理和查询家中的书籍。

你可以：
1. 查询书籍信息（书名、作者、位置等）
2. 统计书籍数量和分类
3. 查找书籍在书墙上的具体位置
4. 提供书籍推荐建议

回答时请：
- 语言简洁友好
- 数据准确清晰
- 主动提供有用的额外信息
- 当无法找到准确信息时，提供可能的替代方案`,
      });
    }

    // 第1轮：调用AI，可能返回工具调用请求
    let response = await callDeepSeek({
      messages: messagesWithSystem,
      tools: aiToolsDefinition,
      temperature: 0.7,
    });

    const currentMessages = [...messagesWithSystem];
    let iterations = 0;
    const maxIterations = 5; // 防止无限循环

    // 循环处理工具调用
    while (response.choices[0].message.tool_calls && iterations < maxIterations) {
      iterations++;

      const assistantMessage = response.choices[0].message;
      currentMessages.push({
        role: 'assistant',
        content: assistantMessage.content || '',
        tool_calls: assistantMessage.tool_calls,
      });

      // 执行所有工具调用
      const toolResults: Message[] = [];

      for (const toolCall of assistantMessage.tool_calls || []) {
        try {
          const functionName = toolCall.function.name;
          const functionArgs = JSON.parse(toolCall.function.arguments);

          console.log(`执行工具: ${functionName}`, functionArgs);

          // 执行工具函数
          const result = await executeToolFunction(functionName, functionArgs);

          toolResults.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify(result, null, 2),
          });
        } catch (error: any) {
          console.error('工具执行失败:', error);
          toolResults.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify({
              error: true,
              message: error.message || '工具执行失败',
            }),
          });
        }
      }

      // 将工具结果添加到消息列表
      currentMessages.push(...toolResults);

      // 再次调用AI，让它基于工具结果生成回答
      response = await callDeepSeek({
        messages: currentMessages,
        tools: aiToolsDefinition,
        temperature: 0.7,
      });
    }

    // 返回最终回答
    const finalMessage = response.choices[0].message;

    return {
      success: true,
      message: {
        role: finalMessage.role,
        content: finalMessage.content || '抱歉，我无法生成回答',
      },
      usage: response.usage,
      iterations, // 用于调试
    };
  } catch (error: any) {
    console.error('AI聊天处理失败:', error);

    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'AI服务处理失败',
    });
  }
});
