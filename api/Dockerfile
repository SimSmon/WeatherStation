FROM node:20-alpine

WORKDIR /app

# 1. On copie les fichiers de dépendances de l'API
COPY api/package*.json ./api/

# 2. On installe les modules Node à l'intérieur du dossier api
WORKDIR /app/api
RUN npm install

# 3. On revient à la racine du conteneur pour copier proprement nos dossiers propres
WORKDIR /app
COPY api/ ./api/
COPY public/ ./public/

# 4. On se remet dans le dossier api pour lancer le serveur
WORKDIR /app/api
EXPOSE 3001

CMD ["node", "server.js"]