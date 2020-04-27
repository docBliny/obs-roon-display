import bodyParser from "body-parser";
import debug from "debug";
import express from "express";
import http from "http";
import io from "socket.io";
import RoonApi from "node-roon-api";
import RoonApiStatus from "node-roon-api-status";
import RoonApiImage from "node-roon-api-image";
import RoonApiTransport from "node-roon-api-transport";
import slug from "slug";

import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const log = debug("server");
const logHttp = debug("server:http");
const logSocket = debug("server:socket");
const roonSubscribeLog = debug("roon:subscribe");
const roonUpdateLog = debug("roon:update");

const ZONE_ROOT_PATH = "/zones/";

export default class App {
  // ********************************************
  // * Constructors
  // ********************************************
  constructor(config) {
    log("ctor()", config);

    this._config = config;
    this._zones = {};

    const app = express();
    this._express = app;

    app.use(express.static("public"));
    app.use(bodyParser.json());
    app.set("view engine", "ejs");
    app.set("views", `${__dirname}/../views`);

    this._httpServer = http.createServer(this.express);
    this._ioServer = io.listen(this.httpServer);

    // Configure web server & routes
    app.use(function(req, res, next) {
      res.header("Access-Control-Allow-Origin", "*");
      res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept"
      );
      next();
    });

    app.get("/", (req, res) => {
      res.render("instructions");
    });

    app.get("/api/images/:key", (req, res) => {
      logHttp(`GET ${req.path}`);

      this.roonCore.services.RoonApiImage.get_image(
        req.params.key,
        { scale: "fit", width: 300, height: 300, format: "image/jpeg" },
        (cb, contentType, body) => {
          res.contentType = contentType;

          res.writeHead(200, { "Content-Type": "image/jpeg" });
          res.end(body, "binary");
        }
      );
    });

    app.get(/.*/, (req, res) => {
      const { path } = req;
      logHttp(`GET ${path}`);

      // Really you'd want to look at accept headers, but this is easier to use for callers
      if(path.endsWith(".json")) {
        // Validate/Attempt to get requested zone
        const zone = this.getZoneByZoneName(path.substring(1, path.length - 5));
        if(zone !== null) {
          res.json(zone);
        } else {
          res.status(404).json({
            error: "Not found",
          });
        }
      } else {
        // Validate/Attempt to get requested zone
        const zone = this.getZoneByZoneName(path.substring(1));

        if(zone !== null) {
          res.render("index", { zoneName: zone._zoneName, zoneDisplayName: zone.display_name });
        } else {
          res.status(404).render("404");
        }
      }
    });

    this._roon = new RoonApi({
      extension_id:        "net.bliny.obs-roon-display",
      display_name:        "Simple Now Playing display intended for OBS",
      display_version:     "1.0.0",
      publisher:           "Tomi Blinnikka",
      email:               "tomi.blinnikka@censored",
      website:             "https://github.com/docBliny/obs-roon-display",
      log_level:           "none",

      core_paired: this.corePaired.bind(this),
      core_unpaired: this.coreUnpaired.bind(this),
    });
  }

  // ********************************************
  // * Properties
  // ********************************************
  get config() {
    return this._config;
  }

  get express() {
    return this._express;
  }

  get httpServer() {
    return this._httpServer;
  }

  get ioServer() {
    return this._ioServer;
  }

  get roon() {
    return this._roon;
  }

  get roonCore() {
    return this._roonCore;
  }

  get zones() {
    // Everyone gets their own copy
    return Object.assign({}, this._zones);
  }

  // ********************************************
  // * Public methods
  // ********************************************
  start() {
    const { serverHttpPort } = this.config;
    log(`Starting web server on port ${serverHttpPort}`);

    // Start web server
    this.httpServer.listen(serverHttpPort, () => {
      console.info(`Server started on port ${serverHttpPort}`);

      // Start Roon
      this.roonApiStatus = new RoonApiStatus(this.roon);

      this.roon.init_services({
        required_services: [ RoonApiTransport, RoonApiImage ],
      });

      this.roonApiStatus.set_status("Extension enabled", false);

      this.roon.start_discovery();
    }).on("error", (err) => {
      console.error(`Server error: ${err.stack}`);
    });
  }

  // ********************************************
  // * Private methods
  // ********************************************
  corePaired(core) {
    roonSubscribeLog("Roon core paired");

    this._roonCore = core;
    const transport = core.services.RoonApiTransport;

    transport.subscribe_zones((response, data) => {
      switch(response) {
      case "Subscribed":
        roonSubscribeLog("subscribe_zones", response, data);
        this.setZonesFromData(data.zones);
        this.emitAllZones(this.zones);
        break;
      case "Changed":
        if(data.zones_changed) {
          roonUpdateLog("zones_changed", response, data);
          this.setZonesFromData(data.zones_changed);
          this.emitAllZones(this.zones);
        }

        if(data.zones_seek_changed) {
          //roonUpdateLog("zones_seek_changed", response, data);
          this.updateZonesFromSeekData(data.zones_seek_changed);
        }
        break;
      default:
        roonSubscribeLog(`Unhandled subscription response "${response}"`);
        break;
      }
    });
  }

  coreUnpaired(core) {
    roonSubscribeLog("Roon core unpaired", core);
    this._nowPlaying = null;
  }

  /**
   * Sets the zones from Roon data. Creates a unique slugified zone name for each zone.
   * Duplicate display names will get an index appended to the zone name.
   *
   * @param      {Object}  zoneData    The Roon zone data.
   */
  setZonesFromData(zoneData) {
    const zoneNames = [];

    if(Array.isArray(zoneData)) {
      // Loop all zones and create unique internal entries
      zoneData.forEach((zone) => {
        let zoneName = slug(zone.display_name);

        if(Object.prototype.hasOwnProperty.call(zoneNames, zoneName)) {
          zoneNames[zoneName] += 1;
          zoneName = `${zoneName}_${zoneNames[zoneName]}`;
        } else {
          zoneNames[zoneName] = 1;
        }
        zone._zoneName = zoneName;

        // Track by native zone ID. This will keep our unique names consistent while we're running
        this._zones[zone.zone_id] = zone;

        this.ioServer.of(`/zones/${zoneName}`).on("connect", this.zoneClientConnected.bind(this));
      });
    }

    log("Current zones", JSON.stringify(this.zones));
  }

  updateZonesFromSeekData(zoneData) {
    // log("seek zone", zone, data.zones_seek_changed);
    if(Array.isArray(zoneData)) {
      zoneData.forEach((seekZone) => {
        const zone = this.zones[seekZone.zone_id];

        if(zone && zone.now_playing) {
          zone.now_playing.seek_position = seekZone.seek_position;
          this.emitZoneStatus(zone._zoneName, zone);
        }
      });
    }
  }

  zoneClientConnected(socket) {
    const path = socket.nsp.name;
    logSocket(`New connection to "${path}"`);
    const pattern = /\/zones\/([^/]*)/;
    const matches = path.match(pattern);

    if(matches.length > 0) {
      this.emitZoneStatusByZoneName(matches[1]);
    }
  }

  /**
   * Gets the zone by the internal zone name.
   *
   * @param      {<type>}  zoneName  The zone name.
   *
   * @return     {<type>}  The zone by zone name, or null if not found.
   */
  getZoneByZoneName(zoneName) {
    let result = null;

    for(const zoneId of Object.keys(this.zones)) {
      const zone = this.zones[zoneId];
      if(zone._zoneName === zoneName) {
        result = zone;
        break;
      }
    }

    return result;
  }

  emitAllZones(zones) {
    // Loop all zones
    for(const zoneId of Object.keys(zones)) {
      const zone = this.zones[zoneId];
      this.emitZoneStatus(zone._zoneName, zone);
    }
  }

  emitZoneStatusByZoneName(zoneName) {
    this.emitZoneStatus(zoneName, this.getZoneByZoneName(zoneName));
  }

  emitZoneStatus(zoneName, zone) {
    // logSocket(`Emitting status for zone "${zoneName}" at "${ZONE_ROOT_PATH}${zoneName}"`);
    this.ioServer.of(`${ZONE_ROOT_PATH}${zoneName}`).emit("zoneStatus", zone);
  }
}