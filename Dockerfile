FROM node:22.5.0@sha256:b44cbfafe84144217b7502cde5d21958500781fb9b13eed74a47486db2277cd5 as base
WORKDIR /app
COPY . ./
RUN npm install 
RUN npm run build

FROM node:22.5.0@sha256:b44cbfafe84144217b7502cde5d21958500781fb9b13eed74a47486db2277cd5 as release
WORKDIR /app
COPY --chown=node:node --from=base /app/package*.json ./
COPY --chown=node:node --from=base /app/node_modules/ node_modules
COPY --chown=node:node --from=base /app/dist/ dist

ENV NODE_ENV "production"
ENV PORT 3000

EXPOSE $PORT
USER node
CMD ["npm", "start"]