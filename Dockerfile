FROM node:26.2.0@sha256:980c5420a7a2ddcb44037726977f2a349e5c7b64217516c7488dce4c74d71583 as base
WORKDIR /app
COPY . ./
RUN npm ci 
RUN npm run build
RUN npm ci --omit=dev

FROM node:26.2.0@sha256:980c5420a7a2ddcb44037726977f2a349e5c7b64217516c7488dce4c74d71583 as release
WORKDIR /app
COPY --chown=node:node --from=base /app/package*.json ./
COPY --chown=node:node --from=base /app/node_modules/ node_modules
COPY --chown=node:node --from=base /app/dist/ dist

ENV NODE_ENV "production"
ENV PORT 3000

EXPOSE $PORT
USER node
CMD ["npm", "start"]