# Use Node.js 20 como base
FROM node:20-alpine

# Criar diretório de trabalho
WORKDIR /app

# Instalar dependências do sistema
RUN apk add --no-cache openssl libc6-compat

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências (simplificado)
RUN npm install

# Copiar todo o código da aplicação
COPY . .

# Gerar o Prisma Client
RUN npx prisma generate

# Expor a porta 80
EXPOSE 80

# Configurar variáveis de ambiente
ENV PORT=80
ENV NODE_ENV=development

# Comando para iniciar a aplicação
CMD ["npm", "run", "dev"]