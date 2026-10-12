FROM node:22-alpine
WORKDIR /app
COPY api/package*.json ./
RUN npm install --omit=dev --no-audit --no-fund
COPY api/src ./src
ENV NODE_ENV=production PORT=3200
EXPOSE 3200
CMD ["sh","-c","node src/init-db.js && exec node src/server.js"]
