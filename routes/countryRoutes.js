const express = require('express');
const router  = express.Router();
const {
  getAllCountries,
  getCountryByCode,
  getCountryEventByPhase,
} = require('../controllers/countryController');
const { getCountryConditions } = require('../services/worldBankService');

// Public — no auth required (needed before login for flag selection)
router.get('/',                    getAllCountries);
router.get('/:code',               getCountryByCode);
router.get('/:code/events/:phase', getCountryEventByPhase);

// GET /api/countries/:code/worldbank
// Returns live World Bank indicators + derived game values
router.get('/:code/worldbank', async (req, res) => {
  try {
    const data = await getCountryConditions(req.params.code);
    res.json(data);
  } catch (err) {
    console.error('World Bank route error:', err);
    res.status(500).json({ error: 'World Bank fetch failed.' });
  }
});

module.exports = router;