FROM node:26.12.1@sha256:97fa0f1b59035c6072721a88d55be1371c7cb1cc942b521e1cc5c72ec87655f4 as base
WORKDIR /app
COPY . ./
RUN npm ci 
RUN npm run build
RUN npm ci --omit=dev

FROM node:26.12.1@sha256:97fa0f1b59035c6072721a88d55be1371c7cb1cc942b521e1cc5c72ec87655f4 as release
WORKDIR /app
COPY --chown=node:node --from=base /app/package*.json ./
COPY --chown=node:node --from=base /app/node_modules/ node_modules
COPY --chown=node:node --from=base /app/dist/ dist

ENV NODE_ENV "production"
ENV PORT 3000

EXPOSE $PORT
USER node
CMD ["npm", "start"]