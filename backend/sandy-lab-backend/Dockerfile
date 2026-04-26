# ---- Étape 1 : compilation ----
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build    # ← génère le dossier dist/

# ---- Étape 2 : image finale légère ----
FROM node:20-alpine
WORKDIR /app

# Copier uniquement les artefacts nécessaires
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./

# Port exposé par l’application
EXPOSE 3000

# Démarrer l’API compilée
CMD ["node", "dist/main"]