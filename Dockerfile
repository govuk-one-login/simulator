FROM node:24.5.0@sha256:dd5c5e4d0a67471a683116483409d1e46605a79521b000c668cff29df06efd51 as base
WORKDIR /app
COPY . ./
RUN npm install 
RUN npm run build

FROM node:24.5.0@sha256:dd5c5e4d0a67471a683116483409d1e46605a79521b000c668cff29df06efd51 as release
WORKDIR /app
COPY --chown=node:node --from=base /app/package*.json ./
COPY --chown=node:node --from=base /app/node_modules/ node_modules
COPY --chown=node:node --from=base /app/dist/ dist

ENV NODE_ENV "production"
ENV PORT 3000

EXPOSE $PORT
USER node
CMD ["npm", "start"]