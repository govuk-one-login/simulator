FROM node:20.16.0@sha256:1ae9ba874435551280e95c8a8e74adf8a48d72b564bf9dfe4718231f2144c88f as base
WORKDIR /app
COPY . ./
RUN npm install 
RUN npm run build

FROM node:20.16.0@sha256:1ae9ba874435551280e95c8a8e74adf8a48d72b564bf9dfe4718231f2144c88f as release
WORKDIR /app
COPY --chown=node:node --from=base /app/package*.json ./
COPY --chown=node:node --from=base /app/node_modules/ node_modules
COPY --chown=node:node --from=base /app/dist/ dist

ENV NODE_ENV "production"
ENV PORT 3000

EXPOSE $PORT
USER node
CMD ["npm", "start"]