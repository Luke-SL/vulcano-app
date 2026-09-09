# ============================================================================
# VULCANO — Dockerfile (build multi-stage)
#
# Stage 1: instala dependências e gera o build estático (quasar build -> SPA)
# Stage 2: serve os arquivos estáticos com Nginx
#
# As variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY são lidas pelo Vite
# em TEMPO DE BUILD (ficam embutidas no JS gerado). Não são variáveis de
# runtime do container — precisam ser passadas como --build-arg. Se você
# trocar de projeto Supabase, precisa gerar uma imagem nova.
#
# Build:
#   docker build \
#     --build-arg VITE_SUPABASE_URL=https://xxxxx.supabase.co \
#     --build-arg VITE_SUPABASE_ANON_KEY=eyJhbGc... \
#     -t vulcano .
#
# Run:
#   docker run -p 8080:80 vulcano
# ============================================================================

# ---------- Stage 1: build ----------
FROM node:20-alpine AS build

WORKDIR /app

# Instala dependências primeiro (aproveita cache do Docker enquanto o código muda)
COPY package.json ./
RUN npm install

# Copia o restante do código
COPY . .

# Variáveis de build do Supabase — precisam existir ANTES do "quasar build",
# pois o Vite as embute nos arquivos estáticos gerados.
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ENV VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
ENV VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY}

RUN npx quasar build


# ---------- Stage 2: runtime (Nginx servindo os arquivos estáticos) ----------
FROM nginx:1.27-alpine AS runtime

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/spa /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
