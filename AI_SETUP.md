# AI功能配置说明

## 环境变量配置

在项目根目录的`.env`文件中添加以下配置：

```bash
# DeepSeek AI 配置
NUXT_DEEPSEEK_API_KEY=sk-your_deepseek_api_key_here
```

## 获取DeepSeek API Key

1. 访问 https://platform.deepseek.com/
2. 注册并登录账号
3. 在"API密钥"页面创建新的API Key
4. 复制API Key并添加到`.env`文件中

## 免费额度

- 新用户获得500万tokens免费额度
- 对话价格：¥0.0001/千tokens（免费额度用完后）
- Embedding价格：¥0.0002/千tokens

## 功能说明

### Phase 1：Function Calling（已实现）

- ✅ 书籍查询（关键词、作者、分类）
- ✅ 统计信息（总数、按作者、按分类）
- ✅ 位置查找（查找书籍在书墙上的位置）

### 支持的查询示例

1. "我有多少本书？"
2. "有哪些前端开发的书？"
3. "国外作者的书有哪些？"
4. "《React设计原理》在哪个位置？"
5. "有多少本建筑类的书？"
6. "哪个作者的书最多？"

## 使用方法

1. 启动项目：`pnpm dev`
2. 点击搜索栏右侧的AI助手图标（✨）
3. 在弹出的对话框中输入问题
4. AI会自动调用相应工具查询数据并回答

## 技术架构

```
用户问题 → Nuxt后端 → DeepSeek AI
                      ↓
                 判断需要的工具
                      ↓
            ┌────────┴────────┐
            ↓                 ↓
       查询MongoDB        统计分析
            ↓                 ↓
       返回结果 → AI生成友好的回答
```

## 注意事项

- API Key不要提交到Git仓库
- 建议在本地`.env`文件中配置（该文件已在.gitignore中）
- 如果没有配置API Key，AI功能将不可用，但不影响其他功能

## Phase 2a: RAG语义搜索（已实现）✅

### 功能说明

- ✅ 基于书籍摘要的向量检索
- ✅ 语义相似度搜索
- ✅ 自动向量化（新增书籍时）
- ✅ 批量同步接口

### 初始化向量库

首次使用前需要同步现有书籍：

```bash
# 方式1: 使用API接口
POST http://localhost:4000/api/ai/embedding/sync
Content-Type: application/json

{}

# 方式2: 强制重新同步所有书籍
POST http://localhost:4000/api/ai/embedding/sync
Content-Type: application/json

{"force": true}
```

### 查看向量库统计

```bash
GET http://localhost:4000/api/ai/embedding/stats
```

### 支持的语义查询示例

1. "找一些关于人性探讨的书"
2. "有讲设计模式的书吗？"
3. "类似《人类简史》的书有哪些？"
4. "记得有本书讲复利思维，是哪本？"

### 工作原理

```
书籍摘要 → DeepSeek Embedding → 向量（数字数组）
                                      ↓
                            存入Chroma向量库（本地）
                                      ↓
用户查询 → Embedding → 相似度检索 → Top-K结果
```

### 存储位置

- 向量数据：`项目目录/chroma_data/`
- 完全本地，数据不出服务器

### 成本

- 初次向量化：1000本书 × 250字 ≈ ¥0.1（一次性）
- 每次查询：¥0.0001
- 月成本（100次语义查询）：¥0.01

---

## 下一步扩展

### Phase 2b: 联网搜索（待实现）

- 集成Jina Reader API
- 获取豆瓣书评
- 搜索新书推荐
