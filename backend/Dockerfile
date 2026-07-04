FROM node:18-alpine

WORKDIR /app

# Install dependencies first (layer cache-friendly)
COPY package*.json ./
RUN npm install --production

# Copy Prisma schema and generate client
COPY prisma ./prisma
RUN npx prisma generate

# Copy the rest of the source
COPY . .

EXPOSE 5000

CMD ["node", "src/app.js"]
