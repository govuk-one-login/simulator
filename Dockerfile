FROM node:22.6.0@sha256:9ac0b68cc6512071449ebbff6f2a205471a390eb02be45f7ee2b3d887e25c18f as base
WORKDIR /app
COPY . ./
RUN npm install 
RUN npm run build

FROM node:22.6.0@sha256:9ac0b68cc6512071449ebbff6f2a205471a390eb02be45f7ee2b3d887e25c18f as release
WORKDIR /app
COPY --chown=node:node --from=base /app/package*.json ./
COPY --chown=node:node --from=base /app/node_modules/ node_modules
COPY --chown=node:node --from=base /app/dist/ dist

ENV NODE_ENV "production"
ENV PORT 3000

EXPOSE $PORT
USER node
CMD ["npm", "start"]