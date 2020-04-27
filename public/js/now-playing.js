console.log("Connecting to " + config.zoneName);
var socket = io("/zones/" + config.zoneName);
socket.on("zoneStatus", function(msg) {
  if(msg && msg.now_playing && msg.now_playing.two_line) {
    var songName = msg.now_playing.two_line.line1;
    var artistName = msg.now_playing.two_line.line2;
    var imageUrl = "/api/images/" + msg.now_playing.image_key;

    var coverArtEl = document.getElementById("cover-art");
    if(!coverArtEl.src.endsWith(imageUrl)) {
      console.log(coverArtEl.src, imageUrl)
      coverArtEl.src = imageUrl;
    }

    var artistNameEl = document.getElementById("artist-name");
    if(artistNameEl.textContent !== artistName) {
      artistNameEl.textContent = artistName;
    }

    var songNameEl = document.getElementById("song-name");
    if(songNameEl.textContent !== songName) {
      songNameEl.textContent = songName;
    }
  }
});
