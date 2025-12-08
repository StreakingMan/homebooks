/**
 * AI Chat 模块类型定义
 */

// 书籍信息
export interface BookInfo {
  isbn?: string;
  title: string;
  author?: string;
  publisher?: string;
  pubdate?: string;
  img?: string;
  summary?: string;
  summary_preview?: string;
  similarity?: number;
  position?: {
    row: number;
    col: number;
    order?: number;
  };
}

// 位置信息
export interface Position {
  row: number;
  col: number;
  description?: string;
}

// 工具调用信息
export interface ToolCallInfo {
  id: string;
  name: string;
  args: Record<string, any>;
  result?: any;
  error?: boolean;
  status: 'pending' | 'running' | 'done' | 'error';
}

// 内容块类型
export type ContentBlock =
  | { type: 'text'; content: string }
  | { type: 'thinking'; content: string; collapsed?: boolean }
  | { type: 'tool_call'; toolCall: ToolCallInfo }
  | { type: 'book_list'; books: BookInfo[]; query?: string }
  | { type: 'book_location'; book: BookInfo; position: Position };

// 聊天消息
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  blocks?: ContentBlock[];
  toolCalls?: ToolCallInfo[];
  status: 'pending' | 'streaming' | 'done' | 'error';
  createdAt: number;
}

// SSE 事件类型
export type SSEEvent =
  | { event: 'delta'; data: { content: string } }
  | { event: 'tool_start'; data: { tools: string[] } }
  | { event: 'tool_call'; data: { id: string; name: string; args: any } }
  | { event: 'tool_result'; data: { id: string; name: string; result: any; error?: boolean } }
  | { event: 'tool_end'; data: Record<string, never> }
  | { event: 'done'; data: { finish_reason: string } }
  | { event: 'error'; data: { message: string } };

// 快捷问题
export const quickQuestions = ['我有多少本书？', '有哪些前端开发的书？', '国外作者的书有哪些？', '找一本关于设计的书'];
