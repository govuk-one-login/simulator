FROM node:24.0.2@sha256:8de41dd3ced665c49a1d7a0801f146fc88cd58ce53350fac59e5bd59c9ee8950 as base
WORKDIR /app
COPY . ./
RUN npm install 
RUN npm run build

FROM node:24.0.2@sha256:8de41dd3ced665c49a1d7a0801f146fc88cd58ce53350fac59e5bd59c9ee8950 as release
WORKDIR /app
COPY --chown=node:node --from=base /app/package*.json ./
COPY --chown=node:node --from=base /app/node_modules/ node_modules
COPY --chown=node:node --from=base /app/dist/ dist

ENV NODE_ENV "production"
ENV PORT 3000

EXPOSE $PORT
USER node
CMD ["npm", "start"]