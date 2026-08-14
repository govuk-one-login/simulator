FROM node:26.7.0@sha256:bde0dae02f2b12d2bce5ee72b2432f0e511767b7b2dc4dd3b064df11ae422fee as base
WORKDIR /app
COPY . ./
RUN npm ci 
RUN npm run build
RUN npm ci --omit=dev

FROM node:26.7.0@sha256:bde0dae02f2b12d2bce5ee72b2432f0e511767b7b2dc4dd3b064df11ae422fee as release
WORKDIR /app
COPY --chown=node:node --from=base /app/package*.json ./
COPY --chown=node:node --from=base /app/node_modules/ node_modules
COPY --chown=node:node --from=base /app/dist/ dist

ENV NODE_ENV "production"
ENV PORT 3000

EXPOSE $PORT
USER node
CMD ["npm", "start"]