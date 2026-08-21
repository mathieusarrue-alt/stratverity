# Dockerfile frontend StratVerity (vinext — build Vite RSC).
# Référencé par docker-compose.yml (service "frontend", contexte ./frontend).
#
# vinext n'étant pas un simple serveur de fichiers statiques, le runtime a
# besoin du build dist/ + de l'outillage vinext (devDependency). On garde donc
# un unique stage avec node_modules complet — c'est fiable et simple, au prix
# d'une image un peu plus lourde. Node >=22.13.0 (cf. engines de package.json).

FROM node:22-alpine

WORKDIR /app

# Dépendances (package-lock pour un build reproductible).
COPY package.json package-lock.json* ./
RUN npm ci

# Sources.
COPY . .

# Variables publiques au build (NEXT_PUBLIC_* = Supabase).
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL} \
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=${NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY}

# Le build vinext génère dist/ (client + server).
RUN npm run build

EXPOSE 3000

# vinext start sert le build dist/ (défaut port 3000).
CMD ["npm", "start"]