FROM node:26.9.0@sha256:e26b4e7d163a29e0d05806e167db8cc0c76f02f633006c1f5c0aeea5a8415147 as base
WORKDIR /app
COPY . ./
RUN npm ci 
RUN npm run build
RUN npm ci --omit=dev

FROM node:26.9.0@sha256:e26b4e7d163a29e0d05806e167db8cc0c76f02f633006c1f5c0aeea5a8415147 as release
WORKDIR /app
COPY --chown=node:node --from=base /app/package*.json ./
COPY --chown=node:node --from=base /app/node_modules/ node_modules
COPY --chown=node:node --from=base /app/dist/ dist

ENV NODE_ENV "production"
ENV PORT 3000

EXPOSE $PORT
USER node
CMD ["npm", "start"]