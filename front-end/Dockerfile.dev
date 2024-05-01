FROM oven/bun

WORKDIR /app

COPY package.json bun.lockb /app/

RUN bun install

COPY . .

CMD ["bun", "run", "dev", "--host"]
