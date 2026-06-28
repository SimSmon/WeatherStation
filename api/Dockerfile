FROM node:20-alpine

WORKDIR /app

# 1. On copie les fichiers de dépendances de l'API (package.json + package-lock.json)
COPY api/package*.json ./api/

# 2. On installe les modules Node à l'intérieur du dossier api
#    npm ci est plus rapide et reproductible que npm install (utilise le lockfile)
WORKDIR /app/api
RUN npm ci --omit=dev

# 3. On revient à la racine du conteneur pour copier nos dossiers
WORKDIR /app
COPY api/ ./api/
COPY public/ ./public/

# 4. On se remet dans le dossier api pour lancer le serveur
WORKDIR /app/api
EXPOSE 3001

CMD ["node", "server.js"]