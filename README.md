# OBS Roon Display
Simply Roon extension to display what's playing in each zone. Intended to be used for OBS as an overlay when playing music while streaming.

Note that I don't really intend to make this more configurable at this point due to time restrictions...

## Requirements
Node 14+ required.

## Using Accessing the display
* Run `npm ci` or `nom install`
* Start the webserver with `npm start` or `node .`
* Open Roon, and go to Settings / Extensions, and then click Enable.
* Open your browser to http://YOUR-IP:8686 .

### Configuring OBS
* Add a new Browser Source
* Set the URL to wherever you're running the extension web server
* Set the width to 1300 pixels and height to 300 pixels
* Adjust the placement on your screen

## TODO
* Dockerize
* Some more documentation

## Running with debug loggin
Try something like `DEBUG=server*,roon:* npm start`.
