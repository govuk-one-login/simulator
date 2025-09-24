FROM node:22.9.0@sha256:69e667a79aa41ec0db50bc452a60e705ca16f35285eaf037ebe627a65a5cdf52 as base
WORKDIR /app
COPY . ./
RUN npm ci 
RUN npm run build
RUN npm ci --omit=dev

FROM node:22.9.0@sha256:69e667a79aa41ec0db50bc452a60e705ca16f35285eaf037ebe627a65a5cdf52 as release
WORKDIR /app
COPY --chown=node:node --from=base /app/package*.json ./
COPY --chown=node:node --from=base /app/node_modules/ node_modules
COPY --chown=node:node --from=base /app/dist/ dist

ENV NODE_ENV "production"
ENV PORT 3001

EXPOSE $PORT
USER node
CMD ["npm", "start"]