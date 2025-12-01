export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { action, params } = body

  // Mock Hardware Control
  console.log(`[LED Control] Action: ${action}`, params)

  // In a real implementation, this would call HomeAssistant or Serial Port
  // For now, we simulate delay and success.

  await new Promise(resolve => setTimeout(resolve, 100))

  if (action === 'locate') {
      if (params?.row === undefined || params?.col === undefined) {
          throw createError({ statusCode: 400, message: 'Missing row/col for locate' })
      }
      return { success: true, message: `Locating cell ${params.row}-${params.col}` }
  }

  if (action === 'toggle') {
      return { success: true, message: `Light turned ${params?.state ? 'on' : 'off'}` }
  }

  if (action === 'move') {
      return { success: true, message: `Moved ${params?.direction}` }
  }

  return { success: true }
})

