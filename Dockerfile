FROM node:26.8@sha256:e961046fec20896e8904f2b4a8b4c7e5ca91826d84d8d33d83dbaa61f942069e as base
WORKDIR /app
COPY . ./
RUN npm ci 
RUN npm run build
RUN npm ci --omit=dev

FROM node:26.8@sha256:e961046fec20896e8904f2b4a8b4c7e5ca91826d84d8d33d83dbaa61f942069e as release
WORKDIR /app
COPY --chown=node:node --from=base /app/package*.json ./
COPY --chown=node:node --from=base /app/node_modules/ node_modules
COPY --chown=node:node --from=base /app/dist/ dist

ENV NODE_ENV "production"
ENV PORT 3000

EXPOSE $PORT
USER node
CMD ["npm", "start"]