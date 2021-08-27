FROM node:14.17.5-buster-slim

# Definition of a Device & Service
ENV POSITION=Runtime \
    SERVICE=ticker-nodejs \
    AION_HOME=/var/lib/aion

RUN mkdir ${AION_HOME}
WORKDIR ${AION_HOME}
# Setup Directoties
RUN mkdir -p \
    $POSITION/$SERVICE
WORKDIR ${AION_HOME}/$POSITION/$SERVICE/

RUN apt-get update && apt-get upgrade -y && apt-get install -y \
    git \
    openssh-client \
 && apt-get clean \
 && rm -rf /var/lib/apt/lists/*

RUN mkdir /root/.ssh/ && touch /root/.ssh/known_hosts && ssh-keyscan -t rsa bitbucket.org >> /root/.ssh/known_hosts

COPY . .

# install and cache app dependencies
RUN --mount=type=secret,id=ssh,target=/root/.ssh/id_rsa yarn install --production

# start app
CMD ["yarn", "start"]
