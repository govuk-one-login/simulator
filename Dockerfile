FROM node:24.4.1@sha256:c7a63f857d6dc9b3780ceb1874544cc22f3e399333c82de2a46de0049e841729 as base
WORKDIR /app
COPY . ./
RUN npm install 
RUN npm run build

FROM node:24.4.1@sha256:c7a63f857d6dc9b3780ceb1874544cc22f3e399333c82de2a46de0049e841729 as release
WORKDIR /app
COPY --chown=node:node --from=base /app/package*.json ./
COPY --chown=node:node --from=base /app/node_modules/ node_modules
COPY --chown=node:node --from=base /app/dist/ dist

ENV NODE_ENV "production"
ENV PORT 3000

EXPOSE $PORT
USER node
CMD ["npm", "start"]