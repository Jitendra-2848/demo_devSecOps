FROM oven/bun:latest

WORKDIR /app

COPY package.json bun.lockb* ./

# Install dependencies INSIDE container
RUN bun install

COPY . .

EXPOSE 8000

CMD ["bun", "run", "src/index.ts"]