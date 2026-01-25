const express = require('express');
const cors = require('cors');

const userRoutes = require('./src/routes/userRoutes');
const fileRoutes = require('./src/routes/fileRoutes');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cors());

// Health Check Route
app.get('/health', (req, res) => {
  res.send('Web Server is up and running!');
});

app.use('/api', userRoutes);
app.use('/api', fileRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
