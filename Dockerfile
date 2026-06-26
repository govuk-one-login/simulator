FROM node:26.4.0@sha256:b46a10d964ad15136ebdf9012142131481caa0697d7a4d4eafe4bbabd818f876 as base
WORKDIR /app
COPY . ./
RUN npm ci 
RUN npm run build
RUN npm ci --omit=dev

FROM node:26.4.0@sha256:b46a10d964ad15136ebdf9012142131481caa0697d7a4d4eafe4bbabd818f876 as release
WORKDIR /app
COPY --chown=node:node --from=base /app/package*.json ./
COPY --chown=node:node --from=base /app/node_modules/ node_modules
COPY --chown=node:node --from=base /app/dist/ dist

ENV NODE_ENV "production"
ENV PORT 3000

EXPOSE $PORT
USER node
CMD ["npm", "start"]