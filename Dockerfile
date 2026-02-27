FROM node:22-alpine

ARG DATABASE_URL
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Installer les dépendances
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# Copier les sources et builder l'application
COPY . .
RUN pnpm build

# Variables d'environnement requises
# BETTER_AUTH_SECRET=<secret>
# BETTER_AUTH_URL=http://localhost:3000

ENV NODE_ENV=production \
    PORT=3000 \
    HOST=0.0.0.0

EXPOSE 3000

RUN chmod +x entrypoint.sh
ENTRYPOINT ["./entrypoint.sh"]
