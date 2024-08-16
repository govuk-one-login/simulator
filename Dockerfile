FROM node:22.6.0@sha256:914458d8617650599ec2c05f6754403a1ce08cb471b0b1de1de439c539f8d45f as base
WORKDIR /app
COPY . ./
RUN npm install 
RUN npm run build

FROM node:22.6.0@sha256:914458d8617650599ec2c05f6754403a1ce08cb471b0b1de1de439c539f8d45f as release
WORKDIR /app
COPY --chown=node:node --from=base /app/package*.json ./
COPY --chown=node:node --from=base /app/node_modules/ node_modules
COPY --chown=node:node --from=base /app/dist/ dist

ENV NODE_ENV "production"
ENV PORT 3000

EXPOSE $PORT
USER node
CMD ["npm", "start"]