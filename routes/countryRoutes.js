const express = require('express');
const router  = express.Router();
const {
  getAllCountries,
  getCountryByCode,
  getCountryEventByPhase,
} = require('../controllers/countryController');

// Public — no auth required (needed before login for flag selection)
router.get('/',                    getAllCountries);
router.get('/:code',               getCountryByCode);
router.get('/:code/events/:phase', getCountryEventByPhase);

module.exports = router;