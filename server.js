require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const scenarioRoutes = require('./routes/scenarioRoutes');
const decisionRoutes = require('./routes/decisionRoutes');
const progressRoutes = require('./routes/progressRoutes');

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/scenarios', scenarioRoutes);
app.use('/api/decisions', decisionRoutes);
app.use('/api/progress', progressRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'Household Survival API is running.' });
});

// Express 5 global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack);
  res.status(500).json({ error: 'Something went wrong.' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});