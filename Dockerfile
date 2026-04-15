FROM node:20-alpine

WORKDIR /app

# Install tzdata for correct time zones
RUN apk add --no-cache tzdata

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

# Ensure data directory exists
RUN mkdir -p /app/data

EXPOSE 3000

ENV NODE_ENV=production
ENV TZ=America/Santo_Domingo

CMD ["node", "server.js"]
