# ChromaDB 设置说明

## 当前状态

✅ **Phase 1 功能完全可用**（不需要 ChromaDB）

- 基础问答："我有多少本书？"
- 关键词搜索："有前端相关的书吗？"
- 作者筛选："国外作者的书有哪些？"
- 位置查询："《React设计原理》在哪里？"

⚠️ **Phase 2a (RAG) 功能需要启动 Chroma 服务器**

- 语义搜索："找一些关于设计的书"
- 相似推荐："类似《人类简史》的书"

---

## 为什么需要 Chroma 服务器？

ChromaDB 3.x 在 Node.js 环境下不支持本地文件存储，必须连接到运行的 Chroma 服务器。

---

## 如何启动 Chroma 服务器

### 方案1：使用 Docker（推荐）

```bash
# 拉取镜像
docker pull chromadb/chroma

# 启动服务器（后台运行）
docker run -d -p 8000:8000 \
  -v $(pwd)/chroma_data:/chroma/chroma \
  --name chroma-server \
  chromadb/chroma

# 查看日志
docker logs -f chroma-server

# 停止服务器
docker stop chroma-server

# 重新启动
docker start chroma-server
```

### 方案2：使用 pip 安装（Python）

```bash
# 安装
pip install chromadb

# 启动服务器
chroma run --host 0.0.0.0 --port 8000 --path ./chroma_data
```

---

## 初始化向量库

服务器启动后，首次使用需要同步书籍向量：

### 方式1：浏览器控制台

```javascript
fetch('/api/ai/embedding/sync', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: '{}',
})
  .then((r) => r.json())
  .then(console.log);
```

### 方式2：curl

```bash
curl -X POST http://localhost:4000/api/ai/embedding/sync \
  -H "Content-Type: application/json" \
  -d '{}'
```

### 预期输出

```json
{
  "success": true,
  "message": "成功向量化 50 本书籍",
  "synced": 50,
  "skipped": 0,
  "total": 50,
  "duration": "15.23秒"
}
```

---

## 测试 RAG 功能

### 1. 查看状态

```bash
curl http://localhost:4000/api/ai/embedding/status
```

### 2. 使用 AI 助手

点击搜索栏右侧的 ✨ AI 助手按钮，尝试：

- "找一些关于设计模式的书"
- "类似《React设计原理》的书有哪些？"
- "有讲架构的书吗？"

---

## 故障排查

### 问题1：Chroma 服务器启动失败

```bash
# 检查端口是否被占用
lsof -i :8000

# 或使用其他端口
docker run -d -p 8001:8000 chromadb/chroma

# 然后在 .env 中配置
NUXT_CHROMA_URL=http://localhost:8001
```

### 问题2：向量同步失败

检查 API Key 是否配置：

```bash
echo $NUXT_DEEPSEEK_API_KEY
```

### 问题3：语义搜索无结果

```bash
# 检查向量库状态
curl http://localhost:4000/api/ai/embedding/status

# 如果 vectorized_books 为 0，执行同步
curl -X POST http://localhost:4000/api/ai/embedding/sync
```

---

## 不想使用 RAG？

如果只需要 Phase 1 的基础功能，完全不需要启动 Chroma 服务器！

Phase 1 功能已经非常强大：

- ✅ 精确的关键词搜索
- ✅ 统计分析
- ✅ 位置查询
- ✅ 作者/分类筛选

只有当你需要**语义理解**和**相似度推荐**时，才需要 RAG 功能。

---

## 性能和成本

### 向量化成本

- 1000本书 × 250字摘要 ≈ ¥0.1（一次性）

### 查询成本

- 每次语义搜索 ≈ ¥0.00015
- 月成本（100次） ≈ ¥0.015

### Chroma 服务器

- 内存占用：~200MB
- 磁盘占用：~50MB（1000本书）
- CPU占用：查询时瞬间峰值，平时几乎为0
