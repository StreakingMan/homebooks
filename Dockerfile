# Build Stage 1
FROM node:22-alpine AS build

WORKDIR /app

# 启用 pnpm
RUN corepack enable

# 复制依赖文件（移除 .env）
COPY package.json pnpm-lock.yaml ./

# 如果有 .npmrc 就复制，没有也不报错
COPY .npmrc* ./

# 安装依赖
RUN pnpm install --frozen-lockfile

# 复制源代码（.env 会被 .dockerignore 排除）
COPY . .

# 构建项目
RUN pnpm build

# Build Stage 2
FROM node:22-alpine

WORKDIR /app

# 只复制构建产物
COPY --from=build /app/.output ./

# 环境变量
ENV PORT=80
ENV HOST=0.0.0.0
ENV NODE_ENV=production

EXPOSE 80

CMD ["node", "./server/index.mjs"]