const fetch = require('node-fetch');

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
    const res  = await fetch(url);
    const data = await res.json();
    const value = data[1]?.[0]?.value;
    return value !== null && value !== undefined ? parseFloat(value) : null;
  } catch (err) {
    console.error(`World Bank fetch failed for ${countryCode}/${indicatorCode}:`, err);
    return null;
  }
}

async function getCountryConditions(countryCode) {
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

  return {
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
  };
}

module.exports = { getCountryConditions };