import App from "./src/App.js";

const config = {
  serverHttpPort: 8686,
};

const app = new App(config);
app.start();
