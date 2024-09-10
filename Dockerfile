FROM node:22.8.0@sha256:bd00c03095f7586432805dbf7989be10361d27987f93de904b1fc003949a4794 as base
WORKDIR /app
COPY . ./
RUN npm install 
RUN npm run build

FROM node:22.8.0@sha256:bd00c03095f7586432805dbf7989be10361d27987f93de904b1fc003949a4794 as release
WORKDIR /app
COPY --chown=node:node --from=base /app/package*.json ./
COPY --chown=node:node --from=base /app/node_modules/ node_modules
COPY --chown=node:node --from=base /app/dist/ dist

ENV NODE_ENV "production"
ENV PORT 3000

EXPOSE $PORT
USER node
CMD ["npm", "start"]