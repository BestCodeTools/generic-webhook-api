FROM node:20.12

RUN mkdir /app

# Create app directory
WORKDIR /app

# Install app dependencies
COPY package*.json ./

RUN npm install

COPY tsconfig.json ./

# Bundle app source
COPY ./src ./src

RUN npm run build

EXPOSE 3000

CMD [ "npm", "start" ]

