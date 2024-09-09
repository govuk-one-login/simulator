FROM node:22.8.0@sha256:8ec02324cb37718197de92e51677781be9f1345c709f31a1f44440c6036d24a2 as base
WORKDIR /app
COPY . ./
RUN npm install 
RUN npm run build

FROM node:22.8.0@sha256:8ec02324cb37718197de92e51677781be9f1345c709f31a1f44440c6036d24a2 as release
WORKDIR /app
COPY --chown=node:node --from=base /app/package*.json ./
COPY --chown=node:node --from=base /app/node_modules/ node_modules
COPY --chown=node:node --from=base /app/dist/ dist

ENV NODE_ENV "production"
ENV PORT 3000

EXPOSE $PORT
USER node
CMD ["npm", "start"]