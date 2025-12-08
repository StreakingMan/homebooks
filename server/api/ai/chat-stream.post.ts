/**
 * AI聊天流式接口
 * 使用 SSE 实时推送 AI 响应
 */
import { callDeepSeekStream } from '../../utils/ai-client';
import { aiToolsDefinition, executeToolFunction } from '../../utils/ai-tools';
import { setResponseHeaders, setResponseStatus } from 'h3';

interface Message {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_calls?: any[];
  tool_call_id?: string;
}

// 系统提示词
const SYSTEM_PROMPT = `你是一个智能书墙管理助手，帮助用户管理和查询家中的书籍。

你可以：
1. 查询书籍信息（书名、作者、位置等）
2. 统计书籍数量和分类
3. 查找书籍在书墙上的具体位置
4. 提供书籍推荐建议

回答时请：
- 语言简洁友好
- 数据准确清晰
- 主动提供有用的额外信息
- 当无法找到准确信息时，提供可能的替代方案`;

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { messages } = body as { messages: Message[] };

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    throw createError({
      statusCode: 400,
      message: '无效的消息格式',
    });
  }

  // 添加系统提示词
  const messagesWithSystem = [...messages];
  if (messagesWithSystem[0]?.role !== 'system') {
    messagesWithSystem.unshift({
      role: 'system',
      content: SYSTEM_PROMPT,
    });
  }

  // 设置 SSE 响应头
  setResponseStatus(event, 200);
  setResponseHeaders(event, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });

  // 获取底层 Node.js response 对象
  const res = event.node.res;

  // SSE 发送函数
  const send = (eventType: string, data: any) => {
    const payload = typeof data === 'string' ? data : JSON.stringify(data);
    res.write(`event: ${eventType}\ndata: ${payload}\n\n`);
  };

  try {
    const currentMessages = [...messagesWithSystem];
    let iterations = 0;
    const maxIterations = 5;

    console.log('🤖 [Chat] 开始处理聊天请求，消息数:', messages.length);

    while (iterations < maxIterations) {
      iterations++;
      console.log(`🔄 [Chat] 迭代 ${iterations}/${maxIterations}`);

      // 调用流式 API
      console.log('📤 [DeepSeek] 发起流式请求...');
      const startTime = Date.now();

      const response = await callDeepSeekStream({
        messages: currentMessages,
        tools: aiToolsDefinition,
        temperature: 0.7,
      });

      console.log(`📥 [DeepSeek] 收到响应，耗时 ${Date.now() - startTime}ms`);

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('无法获取响应流');
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let assistantContent = '';
      const toolCalls: any[] = [];
      let finishReason = '';
      let chunkCount = 0;

      // 读取流式响应
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6);
          if (data === '[DONE]') {
            console.log('✅ [DeepSeek] 流结束 [DONE]');
            continue;
          }

          try {
            const json = JSON.parse(data);
            const delta = json.choices?.[0]?.delta;
            finishReason = json.choices?.[0]?.finish_reason || finishReason;
            chunkCount++;

            if (delta?.content) {
              assistantContent += delta.content;
              // 发送文本增量
              send('delta', { content: delta.content });
            }

            // 处理工具调用增量
            if (delta?.tool_calls) {
              for (const tc of delta.tool_calls) {
                const index = tc.index;
                if (!toolCalls[index]) {
                  toolCalls[index] = {
                    id: tc.id || '',
                    type: 'function',
                    function: { name: '', arguments: '' },
                  };
                }
                if (tc.id) toolCalls[index].id = tc.id;
                if (tc.function?.name) toolCalls[index].function.name += tc.function.name;
                if (tc.function?.arguments) toolCalls[index].function.arguments += tc.function.arguments;
              }
            }
          } catch {
            // 忽略解析错误
          }
        }
      }

      console.log(
        `📊 [DeepSeek] 处理完成: ${chunkCount} chunks, 内容长度: ${assistantContent.length}, 工具调用: ${toolCalls.length}, 结束原因: ${finishReason}`,
      );

      // 如果没有工具调用，结束循环
      if (toolCalls.length === 0 || finishReason !== 'tool_calls') {
        console.log('🏁 [Chat] 对话完成，无工具调用或已完成');
        send('done', { finish_reason: finishReason });
        break;
      }

      // 有工具调用，执行它们
      console.log('🔧 [Chat] 开始执行工具调用:', toolCalls.map((t) => t.function.name).join(', '));
      send('tool_start', { tools: toolCalls.map((t) => t.function.name) });

      // 添加 assistant 消息（包含工具调用）
      currentMessages.push({
        role: 'assistant',
        content: assistantContent || '',
        tool_calls: toolCalls,
      });

      // 执行每个工具并收集结果
      for (const toolCall of toolCalls) {
        const functionName = toolCall.function.name;
        let functionArgs: Record<string, any> = {};

        try {
          functionArgs = JSON.parse(toolCall.function.arguments || '{}');
        } catch {
          functionArgs = {};
        }

        console.log(`🔧 [Tool] 执行 ${functionName}:`, JSON.stringify(functionArgs).slice(0, 200));

        // 发送工具调用事件
        send('tool_call', {
          id: toolCall.id,
          name: functionName,
          args: functionArgs,
        });

        try {
          const toolStartTime = Date.now();
          const result = await executeToolFunction(functionName, functionArgs);
          console.log(`✅ [Tool] ${functionName} 完成，耗时 ${Date.now() - toolStartTime}ms`);

          // 发送工具结果事件
          send('tool_result', {
            id: toolCall.id,
            name: functionName,
            result,
          });

          // 添加工具结果消息
          currentMessages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify(result, null, 2),
          });
        } catch (error: any) {
          console.error(`❌ [Tool] ${functionName} 失败:`, error.message);
          const errorResult = {
            error: true,
            message: error.message || '工具执行失败',
          };

          send('tool_result', {
            id: toolCall.id,
            name: functionName,
            result: errorResult,
            error: true,
          });

          currentMessages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify(errorResult),
          });
        }
      }

      send('tool_end', {});
      console.log('🔄 [Chat] 工具执行完成，继续对话...');
      // 继续循环，让 AI 基于工具结果生成回复
    }
  } catch (error: any) {
    console.error('❌ [Chat] 流式聊天处理失败:', error);
    send('error', { message: error.message || 'AI服务处理失败' });
  } finally {
    console.log('🏁 [Chat] 请求处理完成');
    res.end();
  }
});
