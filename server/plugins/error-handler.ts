// 服务器错误处理插件 - 记录详细错误日志
export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('error', (error, { event }) => {
    console.error('========== SERVER ERROR ==========');
    console.error('Path:', event.path);
    console.error('Method:', event.method);
    console.error('Error:', error);
    console.error('Stack:', error.stack);
    console.error('==================================');
  });

  nitroApp.hooks.hook('request', (event) => {
    console.log(`[${new Date().toISOString()}] ${event.method} ${event.path}`);
  });

  nitroApp.hooks.hook('afterResponse', (event) => {
    const duration = Date.now() - (event.context.startTime || Date.now());
    console.log(`[${new Date().toISOString()}] ${event.method} ${event.path} - ${event.node.res.statusCode} (${duration}ms)`);
  });

  nitroApp.hooks.hook('beforeResponse', (event) => {
    event.context.startTime = Date.now();
  });
});

