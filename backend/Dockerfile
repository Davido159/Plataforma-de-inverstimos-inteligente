# backend/Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN apk add --no-cache dos2unix && \
    npm install

COPY . .

COPY entrypoint.sh /usr/local/bin/entrypoint.sh

RUN dos2unix /usr/local/bin/entrypoint.sh

RUN chmod +x /usr/local/bin/entrypoint.sh

ENTRYPOINT ["entrypoint.sh"]
CMD ["npm", "start"]