FROM node:14-alpine

EXPOSE 8686

# Add git while we install packages
RUN apk add git

RUN mkdir /opt/obs-roon-display
COPY server/ /opt/obs-roon-display

RUN cd /opt/obs-roon-display && \
    npm ci --production

# Remove git
RUN apk del git

RUN chown -R node:node /opt/obs-roon-display && \
    chmod -R 500 /opt/obs-roon-display

RUN touch /opt/obs-roon-display/config.json && \
    chown node:node /opt/obs-roon-display/config.json && \
    chmod 600 /opt/obs-roon-display/config.json

USER node

WORKDIR /opt/obs-roon-display
CMD [ "node", "/opt/obs-roon-display" ]
