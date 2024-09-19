FROM node:22.9.0@sha256:cbe2d5f94110cea9817dd8c5809d05df49b4bd1aac5203f3594d88665ad37988 as base
WORKDIR /app
COPY . ./
RUN npm install 
RUN npm run build

FROM node:22.9.0@sha256:cbe2d5f94110cea9817dd8c5809d05df49b4bd1aac5203f3594d88665ad37988 as release
WORKDIR /app
COPY --chown=node:node --from=base /app/package*.json ./
COPY --chown=node:node --from=base /app/node_modules/ node_modules
COPY --chown=node:node --from=base /app/dist/ dist

ENV NODE_ENV "production"
ENV PORT 3000

EXPOSE $PORT
USER node
CMD ["npm", "start"]