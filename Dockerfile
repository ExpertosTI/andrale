FROM node:20-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy application code
COPY . .

# Ensure data directory exists for SQLite
RUN mkdir -p data && chmod 777 data

EXPOSE 3000

CMD ["node", "server.js"]
