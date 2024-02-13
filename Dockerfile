ARG push_db

FROM node:lts-alpine3.18 AS build

WORKDIR /usr/src/app

# Install packages
COPY *.json ./
COPY src/ ./src

RUN npm ci
RUN npm run build

# We use alpine to have a guaranteed/consistent package manager.
FROM node:lts-alpine3.18

ENV NODE_ENV production
USER node

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci

COPY prisma/schema.prisma ./

COPY --from=build /usr/src/app/dist ./dist

RUN if [ "${push_db}" = "true"] ; npx prisma db push --schema schema.prisma; fi

RUN node dist/util/deploy.js

CMD ["node", "dist/index.js"]
