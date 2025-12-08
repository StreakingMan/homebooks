/**
 * Chroma向量数据库封装
 * 用于存储和检索书籍摘要的向量
 */
import { getEmbedding } from './ai-client';
import { ChromaClient, type Collection } from 'chromadb';

let client: ChromaClient | null = null;
let collection: Collection | null = null;

const COLLECTION_NAME = 'book_summaries';

/**
 * 初始化向量数据库
 */
export async function initVectorStore(): Promise<Collection> {
  if (collection) {
    return collection;
  }

  // 从环境变量获取 ChromaDB 地址，默认 localhost:8000
  const config = useRuntimeConfig();
  const chromaUrl = config.chromaUrl || '';

  try {
    // 连接到运行的Chroma服务器
    client = new ChromaClient({
      path: chromaUrl,
    });

    // 获取或创建集合
    // 使用客户端生成的embedding（硅基流动API），ChromaDB仅负责存储和检索
    collection = await client.getOrCreateCollection({
      name: COLLECTION_NAME,
      metadata: { 'hnsw:space': 'cosine' }, // 使用余弦相似度
    });

    console.log(`✅ 向量数据库已初始化: ${COLLECTION_NAME} @ ${chromaUrl}`);
    return collection;
  } catch (error: any) {
    console.error('❌ 向量数据库初始化失败:', error.message || error);

    // 如果是连接失败，抛出友好的错误
    if (error.message?.includes('Failed to connect')) {
      throw new Error('Chroma服务器未运行。RAG功能需要启动Chroma服务器：docker run -p 8000:8000 chromadb/chroma');
    }
    throw error;
  }
}

/**
 * 向向量库添加单本书籍
 */
export async function addBookToVectorStore(book: { isbn: string; title: string; author?: string; summary?: string }) {
  if (!book.summary || book.summary.length < 10) {
    console.log(`⏭️  跳过书籍 "${book.title}": 摘要为空或过短`);
    return;
  }

  try {
    const col = await initVectorStore();

    // 构建用于向量化的文本（标题 + 作者 + 摘要）
    const textForEmbedding = [book.title, book.author || '', book.summary].filter(Boolean).join(' ');

    // 使用硅基流动API生成向量
    const embedding = await getEmbedding(textForEmbedding);

    // 添加到向量库
    await col.add({
      ids: [book.isbn],
      embeddings: [embedding],
      documents: [book.summary],
      metadatas: [
        {
          title: book.title,
          author: book.author || '',
          isbn: book.isbn,
          summary_preview: book.summary.substring(0, 150),
        },
      ],
    });

    console.log(`✅ 已向量化: ${book.title}`);
  } catch (error) {
    console.error(`❌ 向量化失败 "${book.title}":`, error);
    throw error;
  }
}

/**
 * 批量添加书籍到向量库
 */
export async function addBooksToVectorStore(
  books: Array<{
    isbn: string;
    title: string;
    author?: string;
    summary?: string;
  }>,
) {
  const col = await initVectorStore();

  // 过滤出有摘要的书籍
  const booksWithSummary = books.filter((book) => book.summary && book.summary.length >= 10);

  if (booksWithSummary.length === 0) {
    console.log('⏭️  没有需要向量化的书籍');
    return { synced: 0, skipped: books.length };
  }

  console.log(`📚 准备向量化 ${booksWithSummary.length} 本书...`);

  const ids: string[] = [];
  const documents: string[] = [];
  const metadatas: any[] = [];
  const embeddings: number[][] = [];

  // 构建批量数据
  for (const book of booksWithSummary) {
    const textForEmbedding = [book.title, book.author || '', book.summary || ''].filter(Boolean).join(' ');

    // 使用硅基流动API生成向量
    try {
      const embedding = await getEmbedding(textForEmbedding);

      ids.push(book.isbn);
      documents.push(book.summary || '');
      embeddings.push(embedding);
      metadatas.push({
        title: book.title,
        author: book.author || '',
        isbn: book.isbn,
        summary_preview: (book.summary || '').substring(0, 150),
      });

      console.log(`  ✓ ${book.title}`);
    } catch (error) {
      console.error(`  ✗ ${book.title}:`, error);
      // 出错时跳过这本书
    }
  }

  // 批量添加到向量库
  if (ids.length > 0) {
    await col.add({
      ids,
      embeddings,
      documents,
      metadatas,
    });
  }

  console.log(`✅ 批量向量化完成: ${ids.length}/${booksWithSummary.length}`);
  return { synced: ids.length, skipped: books.length - ids.length };
}

/**
 * 更新书籍向量
 */
export async function updateBookInVectorStore(book: { isbn: string; title: string; author?: string; summary?: string }) {
  if (!book.summary || book.summary.length < 10) {
    // 如果新数据没有摘要，删除旧向量
    await deleteBookFromVectorStore(book.isbn);
    return;
  }

  try {
    // 先删除旧的
    await deleteBookFromVectorStore(book.isbn);

    // 再添加新的
    await addBookToVectorStore(book);

    console.log(`✅ 已更新向量: ${book.title}`);
  } catch (error) {
    console.error(`❌ 更新向量失败 "${book.title}":`, error);
    throw error;
  }
}

/**
 * 从向量库删除书籍
 */
export async function deleteBookFromVectorStore(isbn: string) {
  try {
    const col = await initVectorStore();

    await col.delete({
      ids: [isbn],
    });

    console.log(`✅ 已删除向量: ${isbn}`);
  } catch (error) {
    // 如果不存在就忽略错误
    console.log(`⏭️  向量不存在或已删除: ${isbn}`, error);
  }
}

/**
 * 语义搜索书籍
 */
export async function searchBooksInVectorStore(query: string, limit: number = 5) {
  try {
    const col = await initVectorStore();

    // 使用硅基流动API生成查询向量
    console.log(`🔍 [Embedding] 正在为查询生成向量: "${query}"`);
    const startEmbed = Date.now();
    const queryEmbedding = await getEmbedding(query);
    console.log(`✅ [Embedding] 向量生成完成，耗时 ${Date.now() - startEmbed}ms，维度: ${queryEmbedding.length}`);

    // 执行向量检索
    console.log(`🔍 [ChromaDB] 正在搜索相似书籍，限制: ${limit}条`);
    const startSearch = Date.now();
    const results = await col.query({
      queryEmbeddings: [queryEmbedding],
      nResults: limit,
    });
    console.log(`✅ [ChromaDB] 搜索完成，耗时 ${Date.now() - startSearch}ms，找到 ${results.ids?.[0]?.length || 0} 条结果`);

    // 格式化返回结果
    if (!results.ids || !results.ids[0] || results.ids[0].length === 0) {
      console.log('⚠️  [ChromaDB] 未找到匹配的书籍');
      return [];
    }

    const formattedResults = results.ids[0].map((isbn, index) => ({
      isbn,
      title: results.metadatas?.[0]?.[index]?.title || '',
      author: results.metadatas?.[0]?.[index]?.author || '',
      distance: results.distances?.[0]?.[index] || 0,
      similarity: 1 - (results.distances?.[0]?.[index] || 0), // 转为相似度
      summary_preview: results.metadatas?.[0]?.[index]?.summary_preview || '',
    }));

    // 打印匹配结果和相似度
    console.log('📊 [ChromaDB] 搜索结果:');
    formattedResults.forEach((result, i) => {
      console.log(`  ${i + 1}. "${result.title}" (相似度: ${(result.similarity * 100).toFixed(1)}%)`);
    });

    return formattedResults;
  } catch (error: any) {
    console.error('❌ 语义搜索失败:', error);
    // 如果是Chroma连接失败，返回空数组（优雅降级）
    if (error.message?.includes('Failed to connect to chromadb')) {
      console.log('⚠️  Chroma服务器未运行，RAG功能暂时不可用');
      return [];
    }
    throw error;
  }
}

/**
 * 获取已存储的书籍ISBN列表
 */
export async function getStoredBookISBNs(): Promise<string[]> {
  try {
    const col = await initVectorStore();

    const results = await col.get();

    return results.ids || [];
  } catch (error) {
    console.error('❌ 获取已存储ISBN失败:', error);
    return [];
  }
}

/**
 * 清空向量库
 */
export async function clearVectorStore() {
  try {
    if (!client) {
      await initVectorStore();
    }

    if (client && collection) {
      await client.deleteCollection({ name: COLLECTION_NAME });
      collection = null;
      console.log(`✅ 向量库已清空`);
    }
  } catch (error) {
    console.error('❌ 清空向量库失败:', error);
    throw error;
  }
}

/**
 * 获取向量库统计信息
 */
export async function getVectorStoreStats() {
  try {
    const col = await initVectorStore();
    const results = await col.get();

    return {
      total: results.ids?.length || 0,
      collection_name: COLLECTION_NAME,
    };
  } catch (_error) {
    console.error('❌ 获取统计信息失败:', _error);
    return {
      total: 0,
      collection_name: COLLECTION_NAME,
      error: true,
    };
  }
}
