FROM node:16-alpine as building

ARG RPC_PRIVIDER
ARG TELEGRAM_BOT_TOKEN
ARG DEFAULT_CHANNEL_ID
ARG EL_RPC_URLS
ARG CHAIN_ID
ARG PORT
ARG GLOBAL_THROTTLE_TTL
ARG GLOBAL_THROTTLE_LIMIT
ARG GLOBAL_CACHE_TTL
ARG LOG_LEVEL
ARG LOG_FORMAT
ENV RPC_PRIVIDER=${RPC_PRIVIDER}
ENV TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN}
ENV DEFAULT_CHANNEL_ID=${DEFAULT_CHANNEL_ID}
ENV EL_RPC_URLS=${EL_RPC_URLS}
ENV CHAIN_ID=${CHAIN_ID}
ENV PORT=${PORT}
ENV GLOBAL_THROTTLE_TTL=${GLOBAL_THROTTLE_TTL}
ENV GLOBAL_THROTTLE_LIMIT=${GLOBAL_THROTTLE_LIMIT}
ENV GLOBAL_CACHE_TTL=${GLOBAL_CACHE_TTL}
ENV LOG_LEVEL=${LOG_LEVEL}
ENV LOG_FORMAT=${LOG_FORMAT}

WORKDIR /app

COPY package.json yarn.lock ./
COPY ./tsconfig*.json ./
COPY ./src ./src

RUN echo "RPC_PRIVIDER: ${RPC_PRIVIDER}" > .env
RUN echo "TELEGRAM_BOT_TOKEN: ${TELEGRAM_BOT_TOKEN}" > .env
RUN echo "DEFAULT_CHANNEL_ID: ${DEFAULT_CHANNEL_ID}" > .env
RUN echo "EL_RPC_URLS: ${EL_RPC_URLS}" > .env
RUN echo "CHAIN_ID: ${CHAIN_ID}" > .env
RUN echo "PORT: ${PORT}" > .env
RUN echo "GLOBAL_THROTTLE_TTL: ${GLOBAL_THROTTLE_TTL}" > .env
RUN echo "GLOBAL_THROTTLE_LIMIT: ${GLOBAL_THROTTLE_LIMIT}" > .env
RUN echo "GLOBAL_CACHE_TTL: ${GLOBAL_CACHE_TTL}" > .env
RUN echo "LOG_LEVEL: ${LOG_LEVEL}" > .env
RUN echo "LOG_FORMAT: ${LOG_FORMAT}" > .env
RUN yarn install --frozen-lockfile --non-interactive && yarn cache clean
RUN yarn build

FROM node:16-alpine

WORKDIR /app

COPY --from=building /app/dist ./dist
COPY --from=building /app/node_modules ./node_modules
COPY ./package.json ./

USER node

CMD ["yarn", "start:prod"]
