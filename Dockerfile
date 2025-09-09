FROM node:24.7.0@sha256:ccb086eb457ad144b1157af458bba3ed1352422f1f672609f54f8db567e55eb4 as base
WORKDIR /app
COPY . ./
RUN npm install 
RUN npm run build

FROM node:24.7.0@sha256:ccb086eb457ad144b1157af458bba3ed1352422f1f672609f54f8db567e55eb4 as release
WORKDIR /app
COPY --chown=node:node --from=base /app/package*.json ./
COPY --chown=node:node --from=base /app/node_modules/ node_modules
COPY --chown=node:node --from=base /app/dist/ dist

ENV NODE_ENV "production"
ENV PORT 3000

EXPOSE $PORT
USER node
CMD ["npm", "start"]