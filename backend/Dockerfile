# Use uma imagem base Node.js LTS Alpine para um tamanho menor
FROM node:18-alpine

# Defina o diretório de trabalho dentro do container
WORKDIR /app

# Copie package.json e package-lock.json (ou yarn.lock) primeiro
COPY package*.json ./

# Instale as dependências.
# Escolha UMA das opções abaixo para RUN npm install:
# Opção 1: Instalar tudo (mais simples, imagem um pouco maior)
RUN npm install
# Opção 2: Instalar apenas produção e depois o necessário para CLI (mais otimizado)
# RUN npm install --omit=dev && npm install sequelize-cli mysql2

# Copie o restante do código da sua aplicação para o diretório de trabalho
COPY . .

# Copie o script de entrypoint para uma localização padrão
COPY entrypoint.sh /usr/local/bin/entrypoint.sh

# Adicionar comando para converter finais de linha do entrypoint.sh (SE você não fez isso localmente)
# Se você já corrigiu os finais de linha do entrypoint.sh localmente usando VS Code ou dos2unix,
# esta linha pode não ser estritamente necessária, mas não fará mal tê-la como garantia.
RUN sed -i 's/\r$//' /usr/local/bin/entrypoint.sh

# Dê permissão de execução ao script de entrypoint
RUN chmod +x /usr/local/bin/entrypoint.sh

# Defina o script de entrypoint. Ele será executado quando o container iniciar.
# DEVE HAVER APENAS UMA INSTRUÇÃO ENTRYPOINT
ENTRYPOINT ["entrypoint.sh"]

# Defina o comando padrão que será passado para o entrypoint.sh (via "$@").
# DEVE HAVER APENAS UMA INSTRUÇÃO CMD
CMD ["npm", "start"]