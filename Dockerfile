FROM node:25.1.0@sha256:e524a871ad29ac5fa38b840667a6590f42bc14eb052047815faa0ba421c52b93 as base
WORKDIR /app
COPY . ./
RUN npm ci 
RUN npm run build
RUN npm ci --omit=dev

FROM node:25.1.0@sha256:e524a871ad29ac5fa38b840667a6590f42bc14eb052047815faa0ba421c52b93 as release
WORKDIR /app
COPY --chown=node:node --from=base /app/package*.json ./
COPY --chown=node:node --from=base /app/node_modules/ node_modules
COPY --chown=node:node --from=base /app/dist/ dist

ENV NODE_ENV "production"
ENV PORT 3000

EXPOSE $PORT
USER node
CMD ["npm", "start"]