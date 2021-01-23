FROM node:lts-buster-slim
WORKDIR /opt/app/
COPY ./package*.json .
ENV NODE_ENV production
RUN npm install
COPY ./ ./

CMD ["node", "./index.js"]
