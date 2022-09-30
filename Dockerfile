# RUN 1: compile
# get node version 16
FROM node:16.12-buster-slim

# Create compile directory
WORKDIR /usr/src/app

# copy config files and source code
COPY package*.json ./
COPY tsconfig.json ./
COPY src ./src

# install all dependencies
RUN npm install

# compile code
RUN npm run build

# RUN 2: cleanup
# get node version 16
FROM node:16.12-buster-slim

WORKDIR /usr/src/app

# copy config files
COPY package*.json ./

# get prod dependencies
RUN npm install --only=production

# copy binary files
COPY --from=0 /usr/src/app/dist .

# start up the bot
CMD [ "npm", "start" ]
