require('dotenv').config();
const express = require('express');
const cors    = require('cors');

const authRoutes     = require('./routes/authRoutes');
const countryRoutes  = require('./routes/countryRoutes');
const scenarioRoutes = require('./routes/scenarioRoutes');
const decisionRoutes = require('./routes/decisionRoutes');
const progressRoutes = require('./routes/progressRoutes');
const sessionRoutes  = require('./routes/sessionRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth',      authRoutes);
app.use('/api/countries', countryRoutes);
app.use('/api/scenarios', scenarioRoutes);
app.use('/api/decisions', decisionRoutes);
app.use('/api/progress',  progressRoutes);
app.use('/api/sessions',  sessionRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Household Survival API is running.' });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack);
  res.status(500).json({ error: 'Something went wrong.' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});