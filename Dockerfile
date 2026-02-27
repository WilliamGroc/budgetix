FROM node:22-alpine

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Installer les dépendances
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# Copier les sources et builder l'application
# DATABASE_URL fictive pour satisfaire la vérification au chargement du module
# (postgres.js ne se connecte pas réellement avant la première requête)
COPY . .
RUN DATABASE_URL=postgresql://build:build@localhost/build pnpm build

# Variables d'environnement requises
# DATABASE_URL=postgres://user:password@host:5432/dbname
# BETTER_AUTH_SECRET=<secret>
# BETTER_AUTH_URL=http://localhost:3000

ENV NODE_ENV=production \
    PORT=3000 \
    HOST=0.0.0.0

EXPOSE 3000

RUN chmod +x entrypoint.sh
ENTRYPOINT ["./entrypoint.sh"]
