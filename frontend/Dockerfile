# Build stage
FROM node:24-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Servir con nginx
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]