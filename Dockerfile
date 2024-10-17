FROM node:23.0.0@sha256:4ca0770b829ec8adf901e6e6046737d961f78411bd664774f1fc04b1b4cd73f6 as base
WORKDIR /app
COPY . ./
RUN npm install 
RUN npm run build

FROM node:23.0.0@sha256:4ca0770b829ec8adf901e6e6046737d961f78411bd664774f1fc04b1b4cd73f6 as release
WORKDIR /app
COPY --chown=node:node --from=base /app/package*.json ./
COPY --chown=node:node --from=base /app/node_modules/ node_modules
COPY --chown=node:node --from=base /app/dist/ dist

ENV NODE_ENV "production"
ENV PORT 3000

EXPOSE $PORT
USER node
CMD ["npm", "start"]