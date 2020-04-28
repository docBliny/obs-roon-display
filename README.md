# OBS Roon Display
Simply Roon extension to display what's playing in each zone. Intended to be used for OBS as an overlay when playing music while streaming.

Note that I don't really intend to make this more configurable at this point due to time restrictions...

## Credits
Credits to Aiden Wallis - https://github.com/aidenwallis/nowplaying . I pretty much ended up grabbing the HTML, CSS, and Javascript directly from that.

## Requirements
Node 14+ required.

## Using Accessing the display
* Run `npm ci` or `npm install`
* Start the webserver with `npm start` or `node .`
* Open Roon, and go to Settings / Extensions, and then click Enable.
* Open your browser to http://YOUR-IP:8686 .

### Configuring OBS
* Add a new Browser Source
* Set the URL to wherever you're running the extension web server
* Set height to 300 pixels
* Set the width to your desired width
* Set the FPS to 60
* Adjust the placement and size on your screen

## Troubleshooting
* If the Roon zone isn't available, you'll get the "404 - Not found" page. However, it has a margin at the top, so that it doesn't accidentally show up in your stream, but you can open the link in your browser and see the error.

## TODO
* Dockerize
* Some more documentation

## Running with debug loggin
Try something like `DEBUG=server*,roon:* npm start`.
