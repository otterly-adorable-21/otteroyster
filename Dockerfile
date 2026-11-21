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
# Attach a persistent volume at /data in your host's settings (e.g. Railway
# Volumes) so otters survive restarts. No VOLUME line: Railway rejects it.
EXPOSE 8787
CMD ["node", "--disable-warning=ExperimentalWarning", "server/src/index.js"]
