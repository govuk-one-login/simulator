FROM node:26.3.1@sha256:3c05c2cf0f6a5795dfb7abefb2a4e31a78d6271a99962531c48315ced17d618a as base
WORKDIR /app
COPY . ./
RUN npm ci 
RUN npm run build
RUN npm ci --omit=dev

FROM node:26.3.1@sha256:3c05c2cf0f6a5795dfb7abefb2a4e31a78d6271a99962531c48315ced17d618a as release
WORKDIR /app
COPY --chown=node:node --from=base /app/package*.json ./
COPY --chown=node:node --from=base /app/node_modules/ node_modules
COPY --chown=node:node --from=base /app/dist/ dist

ENV NODE_ENV "production"
ENV PORT 3000

EXPOSE $PORT
USER node
CMD ["npm", "start"]