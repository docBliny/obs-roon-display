# OBS Roon Display
Simple Roon extension to display what's playing in each zone. Intended to be used for OBS as an overlay when playing music while streaming.

To use this extension, you will need to run the project's web server on the same network/subnet as your Roon Core. You have two basic options:
1. (Recommended) Build or use the prebuilt Docker image
1. Install Node (https://nodejs.org/) and run the included server

Both options will require a computer that's running all the time, such as a Raspberry Pi. If you have time, feel free to submit a PR to add this to the Roon Extension Manager (https://github.com/TheAppgineer/roon-extension-manager).

Access the now playing information from your web browser (and OBS Browser Source) from http://YOUR-IP:8686/zone-name where `zone-name` is a slugified version of the Roon zone/player you wish to view.

Note that I don't really intend to make this more configurable at this point due to time restrictions...

## Credits
Credits to Aiden Wallis - https://github.com/aidenwallis/nowplaying . I pretty much ended up grabbing the HTML, CSS, and Javascript for the client display directly from that project.

## Requirements
Node 14+ or Docker.

## Running locally
* Run `npm ci` or `npm install`
* Start the webserver with `npm start` or `node .`

## Running with Docker
```
cd [folder to save config]
# Note, write permissions for user 1000 are required for the config file
touch config.json
chmod 666 config.json
docker run --detach --restart unless-stopped --name obs-roon-display -v ${PWD}/config.json:/opt/obs-roon-display/config.json --network host docbliny/obs-roon-display:latest
```

You may also want to change the volume mapping of the `config.json` file to a persistent location, so that you don't have to re-enable the extension when you update/recreate the Docker container.

There's also an example start script named `start-obs-roon-display.sh` that might work for you.

Note: The above will not work on macOS due to the way Docker Desktop networking is implemented.

You might need to run `docker rm obs-roon-display` before restarting.

To stop: `docker stop obs-roon-display`

To view logs (continuously): `docker logs -f obs-roon-display`

## Enabling the extension in Roon
* Open Roon, and go to **Settings / Extensions**, find the extension, and then click **Enable**.
* Open your browser to http://YOUR-IP:8686 and http://YOUR-IP:8686/zone-name.

## Configuring OBS
* Add a new Browser Source
* Set the URL to wherever you're running the extension web server
* Set height to 300 pixels
* Set the width to however wide you'd like the widget to be
* Set the FPS to 60
* Adjust the placement and size on your screen

## Troubleshooting
A successful launch and connection should display the following in the standard output:
```
Server started on port 8686
Roon core paired
```

### Blank page
Make sure something is actually playing in the zone. The display won't show up unless the zone is either playing or loading.

### Running with debug logging
Try something like `DEBUG=server*,roon:* npm start`.

You can add debug logging with by specifying the `DEBUG` environment variable. Debug namespaces are `server` (`server`, `server:http`, `server:socket`) and `roon` (`roon:subscribe`, `roon:update`).

### Problems with Roon zones
If the Roon zone isn't available, you'll get the "404 - Not found" page. However, it has a margin at the top, so that it doesn't accidentally show up in your stream, but you can open the link in your browser and see the error.

You'll also get this page if the extension server has not paired with Roon yet. Check the output to see if you see `Roon core paired` or not. Verify that the extension shows up in Roon and has been enabled.


