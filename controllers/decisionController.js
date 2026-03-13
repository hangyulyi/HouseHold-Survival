const pool = require('../db');

const submitDecision = async (req, res) => {
  const { decision_id, scenario_id, country_code } = req.body;
  const user_id = req.user.id;

  if (!decision_id || !scenario_id) {
    return res.status(400).json({ error: 'decision_id and scenario_id are required.' });
  }

  try {
    const decisionResult = await pool.query(
      'SELECT * FROM decisions WHERE decision_id = $1', [decision_id]
    );
    if (decisionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Decision not found.' });
    }
    const decision = decisionResult.rows[0];

    // Load country multipliers
    let safetyNetMult       = 1.0;
    let healthcareCostMult  = 1.0;
    let educationAccessMult = 1.0;

    if (country_code) {
      const countryResult = await pool.query(
        `SELECT safety_net_mult, healthcare_cost_mult, education_access_mult
         FROM countries WHERE country_code = $1`,
        [country_code]
      );
      if (countryResult.rows.length > 0) {
        const c            = countryResult.rows[0];
        safetyNetMult       = parseFloat(c.safety_net_mult);
        healthcareCostMult  = parseFloat(c.healthcare_cost_mult);
        educationAccessMult = parseFloat(c.education_access_mult);
      }
    }

    const scenarioResult = await pool.query(
      'SELECT phase_number FROM scenarios WHERE scenario_id = $1', [scenario_id]
    );
    const phase = scenarioResult.rows[0]?.phase_number || 0;

    let economicScore = decision.economic_score;
    let socialScore   = decision.social_score;
    let healthScore   = decision.health_score;

    // Phase 3: healthcare costs scaled by country
    if (phase === 3) {
      if (economicScore < 0) economicScore = Math.round(economicScore * healthcareCostMult);
      if (healthScore  > 0) healthScore   = Math.round(healthScore * (1 / healthcareCostMult * 1.5));
    }

    // Phase 5: education cost scaled by country
    if (phase === 5) {
      if (economicScore < 0) economicScore = Math.round(economicScore * educationAccessMult);
    }

    // Safety net boosts positive social outcomes everywhere
    if (socialScore > 0) socialScore = Math.round(socialScore * safetyNetMult);

    const impactScore = Math.round((economicScore + socialScore + healthScore) / 3);

    const adjustedScores = {
      impact_score:        impactScore,
      economic_score:      economicScore,
      social_score:        socialScore,
      health_score:        healthScore,
      environmental_score: decision.environmental_score,
    };

    // Upsert player_progress
    const existing = await pool.query(
      `SELECT * FROM player_progress WHERE user_id = $1 AND scenario_id = $2`,
      [user_id, scenario_id]
    );

    let progress;
    if (existing.rows.length === 0) {
      const inserted = await pool.query(
        `INSERT INTO player_progress (user_id, scenario_id, decision_id, score, completed, last_played)
         VALUES ($1, $2, $3, $4, TRUE, NOW()) RETURNING *`,
        [user_id, scenario_id, decision_id, impactScore]
      );
      progress = inserted.rows[0];
    } else {
      const updated = await pool.query(
        `UPDATE player_progress
         SET score = score + $1, decision_id = $2, completed = TRUE, last_played = NOW()
         WHERE user_id = $3 AND scenario_id = $4
         RETURNING *`,
        [impactScore, decision_id, user_id, scenario_id]
      );
      progress = updated.rows[0];
    }

    // Update leaderboard
    await pool.query(
      `UPDATE leaderboard SET total_score = total_score + $1 WHERE user_id = $2`,
      [impactScore, user_id]
    );

    // Phase 7 — final outcome
    let finalOutcome = null;
    if (phase === 7) {
      const scoreResult = await pool.query(
        `SELECT COALESCE(SUM(score), 0) AS total FROM player_progress WHERE user_id = $1`,
        [user_id]
      );
      const total = parseInt(scoreResult.rows[0].total);

      let thresholds = { threshold_stabilized: 60, threshold_survival: 35, threshold_poverty: 10 };
      if (country_code) {
        const tr = await pool.query(
          `SELECT threshold_stabilized, threshold_survival, threshold_poverty
           FROM countries WHERE country_code = $1`,
          [country_code]
        );
        if (tr.rows.length > 0) thresholds = tr.rows[0];
      }

      if      (total >= thresholds.threshold_stabilized) finalOutcome = 'Stabilized Household';
      else if (total >= thresholds.threshold_survival)   finalOutcome = 'Economic Survival, Social Loss';
      else if (total >= thresholds.threshold_poverty)    finalOutcome = 'Cycle of Poverty Continues';
      else                                               finalOutcome = 'Crisis State — Household Collapses';

      await pool.query(
        `UPDATE game_sessions
         SET final_ending = $1, total_score = $2, completed_at = NOW()
         WHERE user_id = $3 AND completed_at IS NULL`,
        [finalOutcome, total, user_id]
      );
    }

    res.json({
      message:          'Decision submitted successfully.',
      chosen_decision:  decision,
      adjusted_scores:  adjustedScores,
      updated_progress: progress,
      final_outcome:    finalOutcome,
    });
  } catch (err) {
    console.error('submitDecision error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

const submitEventDecision = async (req, res) => {
  const { event_id, chosen_choice, country_code } = req.body;
  const user_id = req.user.id;

  if (!event_id || !chosen_choice) {
    return res.status(400).json({ error: 'event_id and chosen_choice are required.' });
  }

  const c = chosen_choice.toLowerCase();
  if (!['a', 'b', 'c'].includes(c)) {
    return res.status(400).json({ error: 'chosen_choice must be a, b, or c.' });
  }

  try {
    const eventResult = await pool.query(
      'SELECT * FROM country_events WHERE event_id = $1', [event_id]
    );
    if (eventResult.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found.' });
    }

    const ev = eventResult.rows[0];

    if (c === 'c' && !ev.choice_c_text) {
      return res.status(400).json({ error: 'This event does not have a third choice.' });
    }

    const economicDelta = ev[`choice_${c}_economic`] || 0;
    const socialDelta   = ev[`choice_${c}_social`]   || 0;
    const healthDelta   = ev[`choice_${c}_health`]   || 0;
    const impactDelta   = Math.round((economicDelta + socialDelta + healthDelta) / 3);

    await pool.query(
      `UPDATE leaderboard SET total_score = total_score + $1 WHERE user_id = $2`,
      [impactDelta, user_id]
    );

    res.json({
      message:       'Event choice submitted.',
      event_id,
      chosen_choice: c,
      chosen_text:   ev[`choice_${c}_text`],
      delta: {
        economic: economicDelta,
        social:   socialDelta,
        health:   healthDelta,
        impact:   impactDelta,
      },
    });
  } catch (err) {
    console.error('submitEventDecision error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

module.exports = { submitDecision, submitEventDecision };