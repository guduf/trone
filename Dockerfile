ARG  NODE_TAG=lts
FROM node:${NODE_TAG}
WORKDIR /opt/trone/
COPY ./package*.json ./
ENV NODE_ENV production
RUN npm install
COPY ./ ./
RUN chmod +x ./bin/*
ENV PATH="/opt/trone/bin:${PATH}"
ENTRYPOINT [ "trone" ]
