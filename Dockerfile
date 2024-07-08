FROM node:22.4.0@sha256:2558f19e787cb0baed81a8068adf7509023b43dedce24ed606f8a01522b21313 as base
WORKDIR /app
COPY . ./
RUN npm install 
RUN npm run build

FROM node:22.4.0@sha256:2558f19e787cb0baed81a8068adf7509023b43dedce24ed606f8a01522b21313 as release
WORKDIR /app
COPY --chown=node:node --from=base /app/package*.json ./
COPY --chown=node:node --from=base /app/node_modules/ node_modules
COPY --chown=node:node --from=base /app/dist/ dist

ENV NODE_ENV "production"
ENV PORT 3000

EXPOSE $PORT
USER node
CMD ["npm", "start"]