FROM node:lts-buster-slim
WORKDIR /opt/trone/
COPY ./package*.json ./
ENV NODE_ENV production
RUN npm install
COPY ./ ./
RUN chmod +x ./bin/*
ENV PATH="/opt/trone/bin:${PATH}"
ENTRYPOINT [ "trone" ]
