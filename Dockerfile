FROM node:22.11.0@sha256:95fe7a759f854e06d2a34ed9ab9479e8c790814d649b45a73530979df3e74ac5 as base
WORKDIR /app
COPY . ./
RUN npm install 
RUN npm run build

FROM node:22.11.0@sha256:95fe7a759f854e06d2a34ed9ab9479e8c790814d649b45a73530979df3e74ac5 as release
WORKDIR /app
COPY --chown=node:node --from=base /app/package*.json ./
COPY --chown=node:node --from=base /app/node_modules/ node_modules
COPY --chown=node:node --from=base /app/dist/ dist

ENV NODE_ENV "production"
ENV PORT 3000

EXPOSE $PORT
USER node
CMD ["npm", "start"]