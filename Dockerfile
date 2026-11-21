# Otter & Oyster server: website + API + Discord bot.
# Works on Railway, Fly.io, Render, or any Docker host.
FROM node:22-slim
WORKDIR /app
COPY server/package.json server/package-lock.json ./server/
RUN cd server && npm ci --omit=dev
COPY . .
ENV NODE_ENV=production \
    PORT=8787 \
    DB_PATH=/data/otteroyster.db
# Mount a persistent volume at /data so otters survive restarts.
VOLUME ["/data"]
EXPOSE 8787
CMD ["node", "--disable-warning=ExperimentalWarning", "server/src/index.js"]
