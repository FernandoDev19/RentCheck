# Usa una imagen ligera de Node
FROM node:24-alpine

# Carpeta de trabajo
WORKDIR /app

# Copia dependencias primero (mejor cache)
COPY package*.json ./

# Instala deps
RUN npm install

# Copia el resto del código
COPY . .

# Compila NestJS
RUN npm run build

# Expone el puerto
EXPOSE 3000

# Ejecuta en producción
CMD ["node", "build/main"]