FROM node:25.0.0@sha256:92a8086f817cfaf95bfca41d2f72382ae64e87389fe865f9b2f06335edb34073 as base
WORKDIR /app
COPY . ./
RUN npm ci 
RUN npm run build
RUN npm ci --omit=dev

FROM node:25.0.0@sha256:92a8086f817cfaf95bfca41d2f72382ae64e87389fe865f9b2f06335edb34073 as release
WORKDIR /app
COPY --chown=node:node --from=base /app/package*.json ./
COPY --chown=node:node --from=base /app/node_modules/ node_modules
COPY --chown=node:node --from=base /app/dist/ dist

ENV NODE_ENV "production"
ENV PORT 3000

EXPOSE $PORT
USER node
CMD ["npm", "start"]