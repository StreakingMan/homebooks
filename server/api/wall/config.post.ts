export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { name, rows, cols } = body

  try {
    // Update existing active wall or create new one
    // Ideally we support multiple walls but plan says "currently only one" but design for future.
    // We'll just update the single active wall for now.
    
    let wall = await WallSchema.findOne({ isActive: true })
    
    if (wall) {
      wall.name = name || wall.name
      wall.rows = rows || wall.rows
      wall.cols = cols || wall.cols
      await wall.save()
    } else {
      wall = await WallSchema.create({
        name: name || 'My Book Wall',
        rows: rows || 7,
        cols: cols || 8,
        isActive: true
      })
    }

    return {
      success: true,
      config: wall
    }
  } catch (error) {
    console.error('Failed to update wall config:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to update wall configuration'
    })
  }
})

