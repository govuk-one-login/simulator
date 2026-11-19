FROM node:26.13.1@sha256:e18c3ccdf7d71619990b0e85639f506e2028a95410999cab24cc373cbd10e0ac as base
WORKDIR /app
COPY . ./
RUN npm ci 
RUN npm run build
RUN npm ci --omit=dev

FROM node:26.13.1@sha256:e18c3ccdf7d71619990b0e85639f506e2028a95410999cab24cc373cbd10e0ac as release
WORKDIR /app
COPY --chown=node:node --from=base /app/package*.json ./
COPY --chown=node:node --from=base /app/node_modules/ node_modules
COPY --chown=node:node --from=base /app/dist/ dist

ENV NODE_ENV "production"
ENV PORT 3000

EXPOSE $PORT
USER node
CMD ["npm", "start"]