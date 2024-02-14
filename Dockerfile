FROM node:lts AS build
WORKDIR /usr/src/app

# Install packages
COPY package*.json .
COPY prisma prisma
RUN npm ci

COPY tsconfig*.json .
COPY src src

RUN npm run build

FROM node:lts

ENV NODE_ENV production
USER node
WORKDIR /usr/src/app

COPY package*.json .
COPY prisma prisma
RUN npm ci

COPY --from=build /usr/src/app/dist ./dist

COPY scripts/entrypoint.sh .

CMD ["bash", "entrypoint.sh"]
