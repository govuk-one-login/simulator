FROM node:24.7.0@sha256:701c8a634cb3ddbc1dc9584725937619716882525356f0989f11816ba3747a22 as base
WORKDIR /app
COPY . ./
RUN npm install 
RUN npm run build

FROM node:24.7.0@sha256:701c8a634cb3ddbc1dc9584725937619716882525356f0989f11816ba3747a22 as release
WORKDIR /app
COPY --chown=node:node --from=base /app/package*.json ./
COPY --chown=node:node --from=base /app/node_modules/ node_modules
COPY --chown=node:node --from=base /app/dist/ dist

ENV NODE_ENV "production"
ENV PORT 3000

EXPOSE $PORT
USER node
CMD ["npm", "start"]