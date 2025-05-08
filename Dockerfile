# Build Stage 1

FROM node:22-alpine AS build

RUN apk add --no-cache ca-certificates && \
    update-ca-certificates

WORKDIR /app

RUN corepack enable

# Copy package.json and your lockfile, here we add pnpm-lock.yaml for illustration
COPY package.json pnpm-lock.yaml .env .npmrc ./

# Install dependencies
RUN pnpm install

# Copy the entire project
COPY . .

# Build the project
RUN pnpm build

# Build Stage 2

FROM node:22-alpine
WORKDIR /app

# Only `.output` folder is needed from the build stage
COPY --from=build /app/.output .

# Change the port and host
ENV PORT 80
ENV HOST 0.0.0.0
ENV NODE_ENV=production

EXPOSE 80

CMD ["node", "./server/index.mjs"]
