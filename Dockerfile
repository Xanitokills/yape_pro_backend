# Use Node.js LTS Alpine (más ligero y rápido)
FROM node:20-alpine

# Directorio de trabajo
WORKDIR /app

# Copiar solo package files primero (para cachear dependencias)
COPY package*.json ./

# Instalar solo producción (sin devDependencies)
RUN npm ci --only=production --silent

# Copiar el resto del código
COPY . .

# Exponer puerto
EXPOSE 3000

# Usuario no-root por seguridad
USER node

# Comando de inicio
CMD ["node", "server.js"]
