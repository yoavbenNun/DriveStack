// node-server/server.js
const express = require("express");
const cors = require("cors");

const fileRoutes = require("./src/routes/fileRoutes");
const userRoutes = require("./src/routes/userRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "50mb" }));

app.get("/health", (req, res) => res.json({ ok: true }));

app.use("/api", userRoutes);
app.use("/api", fileRoutes);

app.listen(PORT, () => {
  console.log(`✅ Node server running on http://localhost:${PORT}`);
});
