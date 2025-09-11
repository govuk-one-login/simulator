FROM node:24.8.0@sha256:3357ef4c358ae0f92e943fe51c0c8dfaaadb5d4ee3f989121f54b1aabab39009 as base
WORKDIR /app
COPY . ./
RUN npm install 
RUN npm run build

FROM node:24.8.0@sha256:3357ef4c358ae0f92e943fe51c0c8dfaaadb5d4ee3f989121f54b1aabab39009 as release
WORKDIR /app
COPY --chown=node:node --from=base /app/package*.json ./
COPY --chown=node:node --from=base /app/node_modules/ node_modules
COPY --chown=node:node --from=base /app/dist/ dist

ENV NODE_ENV "production"
ENV PORT 3000

EXPOSE $PORT
USER node
CMD ["npm", "start"]