export default defineEventHandler(async (event) => {
  const haUrl = process.env.HA_URL
  const entityId = process.env.HA_LED_ENTITY_ID
  const accessToken = process.env.HA_TOKEN

  if (!haUrl || !entityId || !accessToken) {
    throw createError({
      statusCode: 500,
      message: 'HA配置不完整'
    })
  }

  const body = await readBody(event)
  const { action } = body

  if (!action || !['turn_on', 'turn_off'].includes(action)) {
    throw createError({
      statusCode: 400,
      message: '无效的操作'
    })
  }

  try {
    console.log('发送请求到:', `${haUrl}/api/services/light/${action}`)
    console.log('请求参数:', {
      entity_id: entityId
    })

    const response = await fetch(`${haUrl}/api/services/light/${action}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        entity_id: entityId
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('HA API响应错误:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
        url: `${haUrl}/api/services/light/${action}`,
        entityId,
        headers: Object.fromEntries(response.headers.entries())
      })
      throw new Error(`HA API请求失败: ${response.status} ${response.statusText}`)
    }

    const responseData = await response.json()
    console.log('HA API响应成功:', responseData)

    return {
      success: true,
      message: `灯已${action === 'turn_on' ? '打开' : '关闭'}`
    }
  } catch (error) {
    console.error('HA API错误:', error)
    throw createError({
      statusCode: 500,
      message: error instanceof Error ? error.message : '控制失败'
    })
  }
}) 