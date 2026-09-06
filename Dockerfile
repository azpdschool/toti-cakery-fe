FROM node:24-alpine AS builder

LABEL org.opencontainers.image.source=https://github.com/azpdschool/toti-cakery-fe

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG VITE_API_BASE_URL=/api
ARG VITE_WHATSAPP_NUMBER=628971398816
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_WHATSAPP_NUMBER=$VITE_WHATSAPP_NUMBER

RUN npm run build

FROM nginx:alpine AS runtime

LABEL org.opencontainers.image.source=https://github.com/azpdschool/toti-cakery-fe

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]
