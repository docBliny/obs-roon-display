#!/bin/bash
docker stop obs-roon-display
docker rm obs-roon-display
touch config.json
chmod 777 config.json
docker run --detach --restart unless-stopped --name obs-roon-display -v ${PWD}/config.json:/opt/obs-roon-display/config.json --network host docbliny/obs-roon-display:latest
