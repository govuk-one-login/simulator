FROM node:22.5.1@sha256:d885885ad8e100d27b65e7837075afea042cc8515ec066cd82cdf34e26fc9fb8 as base
WORKDIR /app
COPY . ./
RUN npm install 
RUN npm run build

FROM node:22.5.1@sha256:d885885ad8e100d27b65e7837075afea042cc8515ec066cd82cdf34e26fc9fb8 as release
WORKDIR /app
COPY --chown=node:node --from=base /app/package*.json ./
COPY --chown=node:node --from=base /app/node_modules/ node_modules
COPY --chown=node:node --from=base /app/dist/ dist

ENV NODE_ENV "production"
ENV PORT 3000

EXPOSE $PORT
USER node
CMD ["npm", "start"]