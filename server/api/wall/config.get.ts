export default defineEventHandler(async (_event) => {
  try {
    const wall = await WallSchema.findOne({ isActive: true });

    return {
      success: true,
      config: wall, // Will be null if not found
    };
  } catch (error) {
    console.error('Failed to get wall config:', error);
    throw createError({
      statusCode: 500,
      message: 'Failed to retrieve wall configuration',
    });
  }
});
