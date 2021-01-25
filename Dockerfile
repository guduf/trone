ARG  NODE_TAG=lts
FROM node:${NODE_TAG}
WORKDIR /opt/trone/
COPY ./package*.json ./
ENV NODE_ENV production
RUN npm install
COPY ./ ./
COPY ./package.json ./node_modules/trone/
COPY ./src/ ./node_modules/trone/src/
RUN chmod +x ./bin/trone
ENV PATH="/opt/trone/bin:${PATH}"
ENTRYPOINT [ "trone" ]
