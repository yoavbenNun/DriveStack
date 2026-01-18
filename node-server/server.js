const express = require("express");
const app = express();
app.use(express.json());

const CPP_HOST = process.env.CPP_HOST || "localhost";
const CPP_PORT = process.env.CPP_PORT || "8080";

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "node-server", cpp: `${CPP_HOST}:${CPP_PORT}` });
});

app.listen(3000, "0.0.0.0", () => {
  console.log("Node server listening on port 3000");
});
