FROM node:26.8.2@sha256:fb192b8ad31841aadc4bb79c44ae0f59d193a798ffbc9fdce37ba6ecb20c2236 as base
WORKDIR /app
COPY . ./
RUN npm ci 
RUN npm run build
RUN npm ci --omit=dev

FROM node:26.8.2@sha256:fb192b8ad31841aadc4bb79c44ae0f59d193a798ffbc9fdce37ba6ecb20c2236 as release
WORKDIR /app
COPY --chown=node:node --from=base /app/package*.json ./
COPY --chown=node:node --from=base /app/node_modules/ node_modules
COPY --chown=node:node --from=base /app/dist/ dist

ENV NODE_ENV "production"
ENV PORT 3000

EXPOSE $PORT
USER node
CMD ["npm", "start"]