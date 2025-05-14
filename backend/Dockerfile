FROM node:20-alpine

WORKDIR /app

# Installation des dépendances système et des outils MongoDB
RUN apk update && \
    apk add --no-cache mongodb-tools

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm install

# Copier le reste du code source
COPY . .

# Créer le répertoire pour les sauvegardes
RUN mkdir -p /app/backups && chmod 777 /app/backups

# Exposer le port
EXPOSE 3000

# Démarrer l'application
CMD ["npm", "run", "dev"]