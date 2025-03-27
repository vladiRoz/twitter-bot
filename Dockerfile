FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm install

# Bundle app source
COPY . .

# Create reports directory
RUN mkdir -p reports

CMD [ "node", "schedule_bot.js" ] 