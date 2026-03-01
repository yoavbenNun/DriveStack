const express = require('express');
const cors = require('cors');
const connectDB = require('./src/config/db');

const userRoutes = require('./src/routes/userRoutes');
const fileRoutes = require('./src/routes/fileRoutes');

const app = express();
const PORT = 3000;
connectDB();

// Middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use('/uploads', express.static('uploads'));
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));


// Health Check Route
app.get('/health', (req, res) => {
  res.send('Web Server is up and running!');
});

app.use('/api', userRoutes);
app.use('/api', fileRoutes);

// Debug error handler (TEMP)
app.use((err, req, res, next) => {
  console.error("UNCAUGHT ERROR:", err);
  res.status(500).json({ error: err.message || "Internal Server Error" });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
