const fetch = require('node-fetch');
const pool  = require('../db');

const WB_BASE = 'https://api.worldbank.org/v2/country';

const WB_CODE_MAP = {
  us: 'US',
  in: 'IN',
  ke: 'KE',
  se: 'SE',
  br: 'BR'
};

async function fetchIndicator(countryCode, indicatorCode) {
  const wbCode = WB_CODE_MAP[countryCode];
  const url = `${WB_BASE}/${wbCode}/indicator/${indicatorCode}?format=json&mrv=1`;

  try {
    const res   = await fetch(url);
    const data  = await res.json();
    const value = data[1]?.[0]?.value;
    return value !== null && value !== undefined ? parseFloat(value) : null;
  } catch (err) {
    console.error(`World Bank fetch failed for ${countryCode}/${indicatorCode}:`, err);
    return null;
  }
}

async function getCountryConditions(countryCode) {
  // 1. Try live World Bank API
  try {
    const [gni, lifeExp, healthExp, eduExp, poverty] = await Promise.all([
      fetchIndicator(countryCode, 'NY.GNP.PCAP.CD'),
      fetchIndicator(countryCode, 'SP.DYN.LE00.IN'),
      fetchIndicator(countryCode, 'SH.XPD.OOPC.CH.ZS'),
      fetchIndicator(countryCode, 'SE.XPD.TOTL.GD.ZS'),
      fetchIndicator(countryCode, 'SI.POV.DDAY'),
    ]);

    const startingMoney = gni
      ? Math.round((gni / 12) * 0.05)
      : null;

    const startingHealth = lifeExp
      ? Math.round(((lifeExp - 60) / 25) * 50 + 40)
      : null;

    const healthcareCostMult = healthExp
      ? Math.round(Math.min(Math.max(healthExp / 25, 0.5), 2.5) * 100) / 100
      : null;

    const educationAccessMult = eduExp
      ? Math.round(Math.max(1.8 - (eduExp * 0.2), 0.3) * 100) / 100
      : null;

    const result = {
      country_code:                  countryCode,
      wb_gni_per_capita:             gni,
      wb_life_expectancy:            lifeExp,
      wb_health_expenditure:         healthExp,
      wb_education_spending:         eduExp,
      wb_poverty_rate:               poverty,
      derived_starting_money:        startingMoney,
      derived_starting_health:       startingHealth,
      derived_healthcare_cost_mult:  healthcareCostMult,
      derived_education_access_mult: educationAccessMult,
      source: 'world_bank_live',
    };

    // 2. Save to cache so we have a fallback for next time
    await pool.query(
      `INSERT INTO world_bank_cache (
         country_code, gni_per_capita, life_expectancy,
         health_expenditure, education_spending, poverty_rate,
         derived_starting_money, derived_starting_health,
         derived_healthcare_cost_mult, derived_education_access_mult,
         fetched_at
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10, NOW())
       ON CONFLICT DO NOTHING`,
      [
        countryCode, gni, lifeExp, healthExp, eduExp, poverty,
        startingMoney, startingHealth, healthcareCostMult, educationAccessMult
      ]
    );

    return result;

  } catch (err) {
    console.warn(`Live World Bank fetch failed for ${countryCode}, trying cache...`);

    // 3. Fall back to most recent cached value
    const cached = await pool.query(
      `SELECT * FROM world_bank_cache
       WHERE country_code = $1
       ORDER BY fetched_at DESC
       LIMIT 1`,
      [countryCode]
    );

    if (cached.rows.length > 0) {
      const c = cached.rows[0];
      return {
        country_code:                  countryCode,
        wb_gni_per_capita:             c.gni_per_capita,
        wb_life_expectancy:            c.life_expectancy,
        wb_health_expenditure:         c.health_expenditure,
        wb_education_spending:         c.education_spending,
        wb_poverty_rate:               c.poverty_rate,
        derived_starting_money:        c.derived_starting_money,
        derived_starting_health:       c.derived_starting_health,
        derived_healthcare_cost_mult:  c.derived_healthcare_cost_mult,
        derived_education_access_mult: c.derived_education_access_mult,
        source: 'cache',
      };
    }

    // 4. Nothing in cache either — return nulls, sessionRoutes will use DB defaults
    console.warn(`No cache found for ${countryCode}, using DB defaults.`);
    return {
      country_code:                  countryCode,
      wb_gni_per_capita:             null,
      wb_life_expectancy:            null,
      wb_health_expenditure:         null,
      wb_education_spending:         null,
      wb_poverty_rate:               null,
      derived_starting_money:        null,
      derived_starting_health:       null,
      derived_healthcare_cost_mult:  null,
      derived_education_access_mult: null,
      source: 'db_defaults',
    };
  }
}

module.exports = { getCountryConditions };