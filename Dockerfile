FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache tzdata
COPY package*.json ./
RUN npm install --omit=dev
COPY . .
RUN mkdir -p /app/data
EXPOSE 3000
CMD ["node", "server.js"]
