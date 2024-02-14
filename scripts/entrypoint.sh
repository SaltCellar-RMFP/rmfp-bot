#!/bin/bash

if [ "${PUSH_DB}" = "true" ]; then
    echo "pushing DB changes via prisma"
    npx prisma db push --schema prisma/schema.prisma
fi

echo "deploying commands to discord"
node dist/util/deploy.js

echo "starting up bot"
node dist/index.js
