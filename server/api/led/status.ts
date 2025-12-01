export default defineEventHandler(async () => {
  const config = useRuntimeConfig();
  const haUrl = config.haUrl;
  const entityId = config.haLedEntityId;
  const accessToken = config.haToken;

  if (!haUrl || !entityId || !accessToken) {
    throw createError({
      statusCode: 500,
      message: 'HA配置不完整'
    })
  }

  try {
    const response = await fetch(`${haUrl}/api/states/${entityId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })

    if (!response.ok) {
      throw new Error('获取状态失败')
    }

    const data = await response.json()
    return {
      success: true,
      isOn: data.state === 'on'
    }
  } catch {
    throw createError({
      statusCode: 500,
      message: '获取状态失败'
    })
  }
}) 