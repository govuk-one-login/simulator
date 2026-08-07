FROM node:26.5.1@sha256:a9875b5ccb02aa527cf7f2297b16ae425a0ff3da2f7d87fce3df41f04ffa0524 as base
WORKDIR /app
COPY . ./
RUN npm ci 
RUN npm run build
RUN npm ci --omit=dev

FROM node:26.5.1@sha256:a9875b5ccb02aa527cf7f2297b16ae425a0ff3da2f7d87fce3df41f04ffa0524 as release
WORKDIR /app
COPY --chown=node:node --from=base /app/package*.json ./
COPY --chown=node:node --from=base /app/node_modules/ node_modules
COPY --chown=node:node --from=base /app/dist/ dist

ENV NODE_ENV "production"
ENV PORT 3000

EXPOSE $PORT
USER node
CMD ["npm", "start"]