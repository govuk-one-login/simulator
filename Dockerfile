FROM node:22.5.1@sha256:86915971d2ce1548842315fcce7cda0da59319a4dab6b9fc0827e762ef04683a as base
WORKDIR /app
COPY . ./
RUN npm install 
RUN npm run build

FROM node:22.5.1@sha256:86915971d2ce1548842315fcce7cda0da59319a4dab6b9fc0827e762ef04683a as release
WORKDIR /app
COPY --chown=node:node --from=base /app/package*.json ./
COPY --chown=node:node --from=base /app/node_modules/ node_modules
COPY --chown=node:node --from=base /app/dist/ dist

ENV NODE_ENV "production"
ENV PORT 3000

EXPOSE $PORT
USER node
CMD ["npm", "start"]