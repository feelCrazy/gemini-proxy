# use the official Bun image
# see all versions at https://hub.docker.com/r/oven/bun/tags
FROM oven/bun:1 AS base
WORKDIR /usr/src/app

# install dependencies into temp directory
# this will cache them and speed up future builds
COPY package*.json bun.lockb ./
RUN bun install
COPY . .

ENV NODE_ENV production
EXPOSE 3000
ENTRYPOINT [ "bun", "start" ]
