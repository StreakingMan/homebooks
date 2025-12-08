/**
 * AI工具函数定义和执行器
 * 定义Function Calling可用的工具
 */
import { BookSchema } from '#imports';
import { searchBooksInVectorStore } from './vector-store';

/**
 * 工具函数定义（提供给AI的工具列表）
 */
export const aiToolsDefinition = [
  {
    type: 'function',
    function: {
      name: 'query_books',
      description: '查询书籍信息，支持按关键词、作者、分类等条件搜索书籍',
      parameters: {
        type: 'object',
        properties: {
          keyword: {
            type: 'string',
            description: '搜索关键词，用于匹配书名、作者、出版社、摘要等字段',
          },
          author_region: {
            type: 'string',
            enum: ['domestic', 'foreign', 'all'],
            description: '作者地区筛选：domestic=国内作者，foreign=国外作者，all=全部',
          },
          category: {
            type: 'string',
            description: '书籍分类或主题关键词，如"建筑"、"历史"、"编程"等',
          },
          limit: {
            type: 'number',
            description: '返回结果数量限制，默认10本，最多50本',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_book_statistics',
      description: '获取书籍统计信息，包括总数、按作者统计、按分类统计等',
      parameters: {
        type: 'object',
        properties: {
          stat_type: {
            type: 'string',
            enum: ['total', 'by_author', 'by_category', 'by_publisher'],
            description: '统计类型：total=总数，by_author=按作者，by_category=按分类，by_publisher=按出版社',
          },
          limit: {
            type: 'number',
            description: '返回Top N结果，默认10',
          },
        },
        required: ['stat_type'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'find_book_location',
      description: '查找指定书籍在书墙上的位置',
      parameters: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            description: '书籍标题（可以是部分匹配）',
          },
          isbn: {
            type: 'string',
            description: '书籍ISBN号（精确匹配）',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'semantic_search_books',
      description: '使用语义搜索查找书籍，基于书籍内容的语义相似度匹配，适合模糊查询和主题搜索',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: '搜索查询，可以是主题、概念、内容描述等，如"人工智能"、"历史叙事"、"设计模式"',
          },
          limit: {
            type: 'number',
            description: '返回结果数量，默认5本',
          },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'find_similar_books',
      description: '查找与指定书籍相似的其他书籍，基于内容相似度推荐',
      parameters: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            description: '参考书籍的标题',
          },
          isbn: {
            type: 'string',
            description: '参考书籍的ISBN（更精确）',
          },
          limit: {
            type: 'number',
            description: '返回结果数量，默认5本',
          },
        },
      },
    },
  },
];

/**
 * 判断作者是否为国外作者（简单规则：非中文姓名）
 */
function isForeignAuthor(author: string): boolean {
  if (!author) return false;
  // 包含中文字符视为国内作者
  return !/[\u4e00-\u9fa5]/.test(author);
}

/**
 * 工具函数执行器
 */
export async function executeToolFunction(functionName: string, args: Record<string, any>): Promise<any> {
  console.log(`执行工具函数: ${functionName}`, args);

  switch (functionName) {
    case 'query_books':
      return await queryBooks(args);

    case 'get_book_statistics':
      return await getBookStatistics(args);

    case 'find_book_location':
      return await findBookLocation(args);

    case 'semantic_search_books':
      return await semanticSearchBooks(args);

    case 'find_similar_books':
      return await findSimilarBooks(args);

    default:
      throw new Error(`未知的工具函数: ${functionName}`);
  }
}

/**
 * 查询书籍
 */
async function queryBooks(args: { keyword?: string; author_region?: 'domestic' | 'foreign' | 'all'; category?: string; limit?: number }) {
  const { keyword, author_region, category, limit = 10 } = args;

  // 构建查询条件
  const query: Record<string, any> = {
    isDeleted: { $ne: true },
  };

  // 关键词搜索（书名、作者、出版社、摘要）
  if (keyword) {
    query.$or = [
      { title: { $regex: keyword, $options: 'i' } },
      { author: { $regex: keyword, $options: 'i' } },
      { publisher: { $regex: keyword, $options: 'i' } },
      { summary: { $regex: keyword, $options: 'i' } },
      { keyword: { $regex: keyword, $options: 'i' } },
    ];
  }

  // 分类搜索
  if (category) {
    if (!query.$or) query.$or = [];
    query.$or.push(
      { keyword: { $regex: category, $options: 'i' } },
      { summary: { $regex: category, $options: 'i' } },
      { title: { $regex: category, $options: 'i' } },
    );
  }

  // 执行查询
  let books = await BookSchema.find(query).limit(Math.min(limit, 50)).lean();

  // 作者地区筛选（后置过滤）
  if (author_region && author_region !== 'all') {
    books = books.filter((book) => {
      const isForeign = isForeignAuthor(book.author || '');
      return author_region === 'foreign' ? isForeign : !isForeign;
    });
  }

  // 返回精简信息
  return {
    total: books.length,
    books: books.map((book) => ({
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      publisher: book.publisher,
      pubdate: book.pubdate,
      summary: book.summary?.substring(0, 150), // 仅返回摘要前150字
      position: book.position,
    })),
  };
}

/**
 * 获取统计信息
 */
async function getBookStatistics(args: { stat_type: string; limit?: number }) {
  const { stat_type, limit = 10 } = args;

  const query = { isDeleted: { $ne: true } };

  switch (stat_type) {
    case 'total': {
      const total = await BookSchema.countDocuments(query);
      const withPosition = await BookSchema.countDocuments({ ...query, position: { $exists: true } });
      const withoutPosition = total - withPosition;

      return {
        total,
        on_wall: withPosition,
        unplaced: withoutPosition,
      };
    }

    case 'by_author': {
      const books = await BookSchema.find(query).lean();
      const authorCounts: Record<string, number> = {};

      books.forEach((book) => {
        const author = book.author || '未知作者';
        authorCounts[author] = (authorCounts[author] || 0) + 1;
      });

      const sorted = Object.entries(authorCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, limit);

      return {
        total_authors: Object.keys(authorCounts).length,
        top_authors: sorted.map(([author, count]) => ({ author, count })),
      };
    }

    case 'by_category': {
      const books = await BookSchema.find(query).lean();
      const categoryCounts: Record<string, number> = {};

      books.forEach((book) => {
        const category = book.keyword || book.class || '未分类';
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      });

      const sorted = Object.entries(categoryCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, limit);

      return {
        total_categories: Object.keys(categoryCounts).length,
        top_categories: sorted.map(([category, count]) => ({ category, count })),
      };
    }

    case 'by_publisher': {
      const books = await BookSchema.find(query).lean();
      const publisherCounts: Record<string, number> = {};

      books.forEach((book) => {
        const publisher = book.publisher || '未知出版社';
        publisherCounts[publisher] = (publisherCounts[publisher] || 0) + 1;
      });

      const sorted = Object.entries(publisherCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, limit);

      return {
        total_publishers: Object.keys(publisherCounts).length,
        top_publishers: sorted.map(([publisher, count]) => ({ publisher, count })),
      };
    }

    default:
      throw new Error(`不支持的统计类型: ${stat_type}`);
  }
}

/**
 * 查找书籍位置
 */
async function findBookLocation(args: { title?: string; isbn?: string }) {
  const { title, isbn } = args;

  if (!title && !isbn) {
    throw new Error('必须提供书名或ISBN');
  }

  const query: Record<string, any> = {
    isDeleted: { $ne: true },
  };

  if (isbn) {
    query.isbn = isbn;
  } else if (title) {
    query.title = { $regex: title, $options: 'i' };
  }

  const books = await BookSchema.find(query).limit(10).lean();

  if (books.length === 0) {
    return {
      found: false,
      message: '未找到匹配的书籍',
    };
  }

  return {
    found: true,
    books: books.map((book) => ({
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      position: book.position
        ? {
            row: book.position.row + 1, // 转为1-based显示
            col: book.position.col + 1,
            description: `第${book.position.row + 1}排第${book.position.col + 1}列`,
          }
        : null,
      on_wall: !!book.position,
    })),
  };
}

/**
 * 语义搜索书籍（基于RAG）
 */
async function semanticSearchBooks(args: { query: string; limit?: number }) {
  const { query, limit = 5 } = args;

  try {
    // 从向量库搜索
    const vectorResults = await searchBooksInVectorStore(query, limit);

    if (vectorResults.length === 0) {
      return {
        found: false,
        message: '未找到相关书籍，可能向量库为空，请先同步书籍数据',
      };
    }

    // 根据ISBN获取完整书籍信息
    const isbns = vectorResults.map((r) => r.isbn);
    const books = await BookSchema.find({
      isbn: { $in: isbns },
      isDeleted: { $ne: true },
    }).lean();

    // 合并结果
    const results = vectorResults.map((vr) => {
      const book = books.find((b) => b.isbn === vr.isbn);
      return {
        title: vr.title,
        author: vr.author,
        isbn: vr.isbn,
        similarity: Math.round(vr.similarity * 100), // 转为百分比
        summary_preview: vr.summary_preview,
        publisher: book?.publisher,
        pubdate: book?.pubdate,
        position: book?.position,
      };
    });

    return {
      found: true,
      query,
      results,
      count: results.length,
    };
  } catch (error: any) {
    console.error('语义搜索失败:', error);
    return {
      found: false,
      error: true,
      message: '语义搜索功能暂时不可用，可能需要先同步书籍向量数据',
    };
  }
}

/**
 * 查找相似书籍（基于RAG）
 */
async function findSimilarBooks(args: { title?: string; isbn?: string; limit?: number }) {
  const { title, isbn, limit = 5 } = args;

  if (!title && !isbn) {
    throw new Error('必须提供书名或ISBN');
  }

  try {
    // 先找到参考书籍
    const query: Record<string, any> = {
      isDeleted: { $ne: true },
    };

    if (isbn) {
      query.isbn = isbn;
    } else if (title) {
      query.title = { $regex: title, $options: 'i' };
    }

    const referenceBooks = await BookSchema.find(query).limit(1).lean();

    if (referenceBooks.length === 0) {
      return {
        found: false,
        message: '未找到参考书籍',
      };
    }

    const referenceBook = referenceBooks[0];

    // 使用书籍的标题和摘要进行语义搜索
    const searchQuery = `${referenceBook.title} ${referenceBook.summary || ''}`;
    const vectorResults = await searchBooksInVectorStore(searchQuery, limit + 1); // +1 因为会包含自己

    // 过滤掉参考书籍本身
    const similarResults = vectorResults.filter((r) => r.isbn !== referenceBook.isbn).slice(0, limit);

    if (similarResults.length === 0) {
      return {
        found: false,
        message: '未找到相似书籍',
      };
    }

    // 获取完整书籍信息
    const isbns = similarResults.map((r) => r.isbn);
    const books = await BookSchema.find({
      isbn: { $in: isbns },
      isDeleted: { $ne: true },
    }).lean();

    // 合并结果
    const results = similarResults.map((vr) => {
      const book = books.find((b) => b.isbn === vr.isbn);
      return {
        title: vr.title,
        author: vr.author,
        isbn: vr.isbn,
        similarity: Math.round(vr.similarity * 100),
        summary_preview: vr.summary_preview,
        publisher: book?.publisher,
        pubdate: book?.pubdate,
      };
    });

    return {
      found: true,
      reference_book: {
        title: referenceBook.title,
        author: referenceBook.author,
        isbn: referenceBook.isbn,
      },
      similar_books: results,
      count: results.length,
    };
  } catch (error: any) {
    console.error('查找相似书籍失败:', error);
    return {
      found: false,
      error: true,
      message: '相似书籍查找功能暂时不可用，可能需要先同步书籍向量数据',
    };
  }
}
