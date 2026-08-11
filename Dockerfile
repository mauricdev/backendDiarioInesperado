# Usamos la misma versión de Node
FROM node:24-alpine

# Carpeta de trabajo
WORKDIR /app

# Archivos de dependencias
COPY --chown=node:node package*.json ./

# Instalamos dependencias
RUN npm install

# Copiamos el resto del código
COPY --chown=node:node . .

# Generamos el cliente de Prisma para que TypeScript lo reconozca
RUN npx prisma generate

# Cambiamos al usuario sin privilegios 'node'
USER node

# Exponemos el puerto por defecto de NestJS
EXPOSE 3000

# Comando para iniciar NestJS en modo desarrollo (con recarga automática)
CMD ["npm", "run", "start:dev"]