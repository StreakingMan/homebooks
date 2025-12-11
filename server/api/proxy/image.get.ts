// Server-side image proxy to avoid CORS issues
export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const url = query.url as string;

  if (!url) {
    throw createError({
      statusCode: 400,
      message: 'Missing url parameter',
    });
  }

  try {
    const parsedUrl = new URL(url);
    // Only allow tanshuapi image domain
    if (!parsedUrl.hostname.includes('tanshuapi.com')) {
      throw createError({
        statusCode: 403,
        message: 'Domain not allowed',
      });
    }

    // Use proxyRequest to directly proxy the image
    return proxyRequest(event, url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
    });
  } catch (error: any) {
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to proxy image',
    });
  }
});
