FROM node:20-alpine

WORKDIR /app/backend

COPY SuperBoss/backend/package.json ./

RUN npm install --omit=dev

COPY SuperBoss/backend ./

ENV NODE_ENV=production

EXPOSE 8080

CMD ["npm", "start"]
