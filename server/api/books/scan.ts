export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { isbn } = body

  if (!isbn) {
    throw createError({
      statusCode: 400,
      message: 'ISBN不能为空'
    })
  }

  try {
    // 调用豆瓣API获取书籍信息
    const response = await fetch(`https://api.douban.com/v2/book/isbn/${isbn}`)
    
    if (!response.ok) {
      throw new Error('获取书籍信息失败')
    }

    const data = await response.json()
    
    // 格式化书籍信息
    const book = {
      title: data.title,
      author: data.author.join(', '),
      isbn: data.isbn13 || data.isbn10,
      publisher: data.publisher,
      pubdate: data.pubdate,
      img: data.image,
      summary: data.summary
    }

    // 保存到数据库
    // TODO: 实现数据库保存逻辑

    return {
      success: true,
      book
    }
  } catch (error) {
    console.error('扫码错误:', error)
    throw createError({
      statusCode: 500,
      message: '获取书籍信息失败'
    })
  }
}) 