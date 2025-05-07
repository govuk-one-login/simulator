FROM node:24.0.0@sha256:0625f79a0c9f5005e31dba1761260b9f66ea8a3293e5f645eb4550a4c7dcdbb9 as base
WORKDIR /app
COPY . ./
RUN npm install 
RUN npm run build

FROM node:24.0.0@sha256:0625f79a0c9f5005e31dba1761260b9f66ea8a3293e5f645eb4550a4c7dcdbb9 as release
WORKDIR /app
COPY --chown=node:node --from=base /app/package*.json ./
COPY --chown=node:node --from=base /app/node_modules/ node_modules
COPY --chown=node:node --from=base /app/dist/ dist

ENV NODE_ENV "production"
ENV PORT 3000

EXPOSE $PORT
USER node
CMD ["npm", "start"]