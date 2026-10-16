FROM node:26.11.1@sha256:32fa97f3363975684b08bf4e8a68a47c7905175cc20275b50b974bbd02aba731 as base
WORKDIR /app
COPY . ./
RUN npm ci 
RUN npm run build
RUN npm ci --omit=dev

FROM node:26.11.1@sha256:32fa97f3363975684b08bf4e8a68a47c7905175cc20275b50b974bbd02aba731 as release
WORKDIR /app
COPY --chown=node:node --from=base /app/package*.json ./
COPY --chown=node:node --from=base /app/node_modules/ node_modules
COPY --chown=node:node --from=base /app/dist/ dist

ENV NODE_ENV "production"
ENV PORT 3000

EXPOSE $PORT
USER node
CMD ["npm", "start"]