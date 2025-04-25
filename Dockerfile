FROM node:18.17-alpine3.18 AS base


COPY ./ /app
WORKDIR /app

FROM base AS builder
RUN npm config set registry https://registry.npmmirror.com
RUN npm install 
RUN npm run build:test \
    && npm run build:prod

FROM nginx:1.22.1-alpine3.17

WORKDIR /app

COPY --from=builder /app/dist /app/dist
COPY --from=builder /app/test_dist /app/test_dist