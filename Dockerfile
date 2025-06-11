FROM node:24.2.0@sha256:2a44af4aa20d3c9a4cb80c979a9853974600dd73e00423130305f1331ac9e63c as base
WORKDIR /app
COPY . ./
RUN npm install 
RUN npm run build

FROM node:24.2.0@sha256:2a44af4aa20d3c9a4cb80c979a9853974600dd73e00423130305f1331ac9e63c as release
WORKDIR /app
COPY --chown=node:node --from=base /app/package*.json ./
COPY --chown=node:node --from=base /app/node_modules/ node_modules
COPY --chown=node:node --from=base /app/dist/ dist

ENV NODE_ENV "production"
ENV PORT 3000

EXPOSE $PORT
USER node
CMD ["npm", "start"]