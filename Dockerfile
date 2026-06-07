# Usamos la misma versión de Node
FROM node:24-alpine

# Carpeta de trabajo
WORKDIR /app

# Archivos de dependencias
COPY package*.json ./

# Instalamos dependencias
RUN npm install

# Copiamos el resto del código
COPY . .

# Exponemos el puerto por defecto de NestJS
EXPOSE 3000

# Comando para iniciar NestJS en modo desarrollo (con recarga automática)
CMD ["npm", "run", "start:dev"]