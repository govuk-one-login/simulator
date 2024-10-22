FROM node:22.10.0@sha256:da53547a061beb7f11f58ee2231589b999acfca89bdf6dfd740627340c879f63 as base
WORKDIR /app
COPY . ./
RUN npm install 
RUN npm run build

FROM node:22.10.0@sha256:da53547a061beb7f11f58ee2231589b999acfca89bdf6dfd740627340c879f63 as release
WORKDIR /app
COPY --chown=node:node --from=base /app/package*.json ./
COPY --chown=node:node --from=base /app/node_modules/ node_modules
COPY --chown=node:node --from=base /app/dist/ dist

ENV NODE_ENV "production"
ENV PORT 3000

EXPOSE $PORT
USER node
CMD ["npm", "start"]