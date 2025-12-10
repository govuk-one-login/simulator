FROM node:24.11.1@sha256:0c4b1219e836193f8ff099c43a36cb6ebf1bfe4a9a391e9f9eca5b4c96fae5b3 as base
WORKDIR /app
COPY . ./
RUN npm ci 
RUN npm run build
RUN npm ci --omit=dev

FROM node:24.11.1@sha256:0c4b1219e836193f8ff099c43a36cb6ebf1bfe4a9a391e9f9eca5b4c96fae5b3 as release
WORKDIR /app
COPY --chown=node:node --from=base /app/package*.json ./
COPY --chown=node:node --from=base /app/node_modules/ node_modules
COPY --chown=node:node --from=base /app/dist/ dist

ENV NODE_ENV "production"
ENV PORT 3000

EXPOSE $PORT
USER node
CMD ["npm", "start"]