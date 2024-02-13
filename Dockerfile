ARG push_db

FROM node:latest AS build
WORKDIR /usr/src/app

# Install packages
COPY package*.json .
COPY prisma prisma
RUN npm ci

COPY tsconfig*.json .
COPY src src

RUN npm run build

# We use alpine to have a guaranteed/consistent package manager.
FROM node:latest

ENV NODE_ENV production
USER node
WORKDIR /usr/src/app

COPY package*.json .
COPY prisma prisma
RUN npm ci

COPY --from=build /usr/src/app/dist ./dist

RUN if [ "${push_db}" = "true"] ; then npx prisma db push --schema schema.prisma; fi

RUN node dist/util/deploy.js

CMD ["node", "dist/index.js"]
