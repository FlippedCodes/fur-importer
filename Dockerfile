# RUN 1: compile
# get node version 18
FROM node:20.16-buster-slim

# Create compile directory
WORKDIR /usr/src/app

# copy config files
COPY package*.json ./
COPY tsconfig.json ./

# install all dependencies
RUN npm install --include dev

# copy source code
COPY src ./src

# compile code
RUN npm run build

# RUN 2: cleanup
# get node version 18
FROM node:18.5-buster-slim

WORKDIR /usr/src/app

# copy config files
COPY package*.json ./

# get prod dependencies
RUN npm ci --omit=dev

# copy binary files
COPY --from=0 /usr/src/app/dist .

# start up the bot
CMD [ "npm", "start" ]
