FROM node:26.3.0@sha256:f9a1756160a9e1c3dca456bc0b185bf8f2f112a6771c694df87288046f4306f1 as base
WORKDIR /app
COPY . ./
RUN npm ci 
RUN npm run build
RUN npm ci --omit=dev

FROM node:26.3.0@sha256:f9a1756160a9e1c3dca456bc0b185bf8f2f112a6771c694df87288046f4306f1 as release
WORKDIR /app
COPY --chown=node:node --from=base /app/package*.json ./
COPY --chown=node:node --from=base /app/node_modules/ node_modules
COPY --chown=node:node --from=base /app/dist/ dist

ENV NODE_ENV "production"
ENV PORT 3000

EXPOSE $PORT
USER node
CMD ["npm", "start"]