console.log("Connecting to " + config.zoneName);

var App = {};

var container = document.getElementById("container");
var currentAlbumCover = document.getElementById("album-current");
var newAlbumCover = document.getElementById("album-new");
var artistsElement = document.getElementById("artists");
var songName = document.getElementById("name");

App.currentSong = "";
App.currentCover = "";
App.open = false;
App.fullyOpen = false;
App.firstAlbumLoad = true;
App.scrollingSong = false;
App.scrollingArtists = false;

App.onZoneUpdate = function(msg) {
  if(msg && msg.now_playing && msg.now_playing.two_line) {
    if(msg.state != "playing" && msg.state != "loading") {
      if(App.open) {
        App.close();
      }
    } else {
      const data = {
        songName: msg.now_playing.two_line.line1,
        artists: msg.now_playing.two_line.line2,
        albumCover: msg.now_playing.image_key == undefined ? "/img/album.jpg" : "/api/images/" + msg.now_playing.image_key,
      };

      if(App.open) {
        App.startUpdate(data);
      } else {
        App.openElement();
        setTimeout(App.startUpdate(data), 1200);
      }
    }
  } else {
    // Nothing playing
    if(App.open) {
      App.close();
    }
  }
}

App.close = function() {
  App.open = false;
  App.fullyOpen = false;
  App.firstAlbumLoad = true;
  App.currentCover = "";
  App.currentSong = "";
  songName.classList.add("drop");
  setTimeout(function() {
    artistsElement.classList.add("drop");
  }, 350);
  setTimeout(function() {
    songName.innerHTML = "";
    artistsElement.innerHTML = "";
    songName.className = "";
    artistsElement.className = "";
    App.scrollingSong = false;
    container.classList.remove("active");
  }, 800);
  setTimeout(function() {
    container.classList.remove("raise");
  }, 1350);
  setTimeout(function() {
    currentAlbumCover.classList.remove("active");
    currentAlbumCover.src = "";
    newAlbumCover.classList.remove("active");
    newAlbumCover.src = "";
  }, 1800);
};

App.startUpdate = function(data) {
  if(App.currentSong !== data.songName) {
    App.currentSong = data.songName;
    App.updateSongName(data.artists, data.songName);
  }
  if(App.currentCover !== data.albumCover) {
    App.currentCover = data.albumCover;
    App.updateCover(data.albumCover);
  }
};

App.openElement = function() {
  App.open = true;
  container.classList.add("raise");
  setTimeout(function() {
    container.classList.add("active");
  }, 550);
  setTimeout(function() {
    App.fullyOpen = true;
  }, 1500);
}

App.updateSongName = function(artists, name) {
  artistsElement.classList.remove("active");
  artistsElement.classList.remove("scrolling");

  setTimeout(function() {
    songName.classList.remove("active");
    songName.classList.remove("scrolling");
  }, 200);

  setTimeout(function() {
    artistsElement.textContent = artists;
    artistsElement.classList.add("active");
  }, 550);

  setTimeout(function() {
    const maxWidth = container.offsetWidth - (300 + 30);
    void artistsElement.offsetWidth;

    if(artistsElement.offsetWidth > maxWidth) {
      if(!App.scrollingArtists) {
        App.scrollingArtists = true;
        artistsElement.classList.add("scrolling");
      }
    } else {
      if(App.scrollingArtists) {
        App.scrollingArtists = false;
        artistsElement.classList.remove("scrolling");
      }
    }
  }, 2000);

  setTimeout(function() {
    songName.textContent = name;
    songName.classList.add("active");
  }, 750);

  setTimeout(function() {
    const maxWidth = container.offsetWidth - (300 + 30);
    void songName.offsetWidth;

    if(songName.offsetWidth > maxWidth) {
      if(!App.scrollingSong) {
        App.scrollingSong = true;
        songName.classList.add("scrolling");
      }
    } else {
      if(App.scrollingSong) {
        App.scrollingSong = false;
        songName.classList.remove("scrolling");
      }
    }
  }, 2000);
};

App.updateCover = function(cover) {
  newAlbumCover.src = cover;
  newAlbumCover.onload = function() {
    newAlbumCover.className += " active";
    if(App.firstAlbumLoad) {
      currentAlbumCover.classList.add("active");
    }
    setTimeout(function() {
      currentAlbumCover.src = cover;
      newAlbumCover.classList.remove("active");
      setTimeout(function() {
        newAlbumCover.src = "";
      }, 500);
    }, 450);
  };
};

App.start = function() {
  var socket = io("/zones/" + config.zoneName);
  socket.on("zoneStatus", App.onZoneUpdate);
};

App.start();
