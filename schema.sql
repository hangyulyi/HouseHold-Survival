-- ============================================================
-- Household Survival — PostgreSQL Schema
-- SDG 1: No Poverty | SENG 401
-- 5 Countries × 7 Phases
-- ============================================================

-- Run this first alone in psql:
-- CREATE DATABASE household_survival;

-- Then connect and run the rest:

DROP TABLE IF EXISTS player_progress   CASCADE;
DROP TABLE IF EXISTS leaderboard        CASCADE;
DROP TABLE IF EXISTS game_sessions      CASCADE;
DROP TABLE IF EXISTS decisions          CASCADE;
DROP TABLE IF EXISTS scenarios          CASCADE;
DROP TABLE IF EXISTS country_events     CASCADE;
DROP TABLE IF EXISTS countries          CASCADE;
DROP TABLE IF EXISTS users              CASCADE;

-- ── users ────────────────────────────────────────────────────
CREATE TABLE users (
    user_id       SERIAL PRIMARY KEY,
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    username      VARCHAR(100),
    country_code  VARCHAR(10),
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── countries ────────────────────────────────────────────────
CREATE TABLE countries (
    country_code          VARCHAR(10)  PRIMARY KEY,
    country_name          VARCHAR(100) NOT NULL,
    flag_emoji            VARCHAR(10),
    starting_money        INT NOT NULL,
    starting_health       INT NOT NULL,
    starting_stress       INT NOT NULL,
    starting_happiness    INT NOT NULL,
    starting_debt         INT NOT NULL,
    healthcare_cost_mult  NUMERIC(4,2) NOT NULL DEFAULT 1.0,
    education_access_mult NUMERIC(4,2) NOT NULL DEFAULT 1.0,
    safety_net_mult       NUMERIC(4,2) NOT NULL DEFAULT 1.0,
    threshold_stabilized  INT NOT NULL DEFAULT 60,
    threshold_survival    INT NOT NULL DEFAULT 35,
    threshold_poverty     INT NOT NULL DEFAULT 10,
    visual_setting        VARCHAR(100),
    ambient_sound         VARCHAR(100),
    difficulty_label      VARCHAR(50),
    intro_text            TEXT
);

-- ── country_events ───────────────────────────────────────────
CREATE TABLE country_events (
    event_id          SERIAL PRIMARY KEY,
    country_code      VARCHAR(10) REFERENCES countries(country_code) ON DELETE CASCADE,
    event_phase       INT NOT NULL,
    event_title       VARCHAR(255) NOT NULL,
    event_description TEXT NOT NULL,
    choice_a_text     TEXT NOT NULL,
    choice_a_economic INT DEFAULT 0,
    choice_a_social   INT DEFAULT 0,
    choice_a_health   INT DEFAULT 0,
    choice_b_text     TEXT NOT NULL,
    choice_b_economic INT DEFAULT 0,
    choice_b_social   INT DEFAULT 0,
    choice_b_health   INT DEFAULT 0,
    choice_c_text     TEXT,
    choice_c_economic INT DEFAULT 0,
    choice_c_social   INT DEFAULT 0,
    choice_c_health   INT DEFAULT 0
);

-- ── scenarios ────────────────────────────────────────────────
CREATE TABLE scenarios (
    scenario_id  SERIAL PRIMARY KEY,
    phase_number INT NOT NULL,
    title        VARCHAR(255) NOT NULL,
    description  TEXT NOT NULL,
    sdg_goal     VARCHAR(50),
    difficulty   VARCHAR(50)
);

-- ── decisions ────────────────────────────────────────────────
CREATE TABLE decisions (
    decision_id         SERIAL PRIMARY KEY,
    scenario_id         INT REFERENCES scenarios(scenario_id) ON DELETE CASCADE,
    choice_text         TEXT NOT NULL,
    is_minigame_trigger BOOLEAN DEFAULT FALSE,
    impact_score        INT DEFAULT 0,
    environmental_score INT DEFAULT 0,
    economic_score      INT DEFAULT 0,
    social_score        INT DEFAULT 0,
    health_score        INT DEFAULT 0
);

-- ── player_progress ──────────────────────────────────────────
CREATE TABLE player_progress (
    progress_id  SERIAL PRIMARY KEY,
    user_id      INT REFERENCES users(user_id) ON DELETE CASCADE,
    scenario_id  INT REFERENCES scenarios(scenario_id),
    decision_id  INT REFERENCES decisions(decision_id),
    score        INT DEFAULT 0,
    completed    BOOLEAN DEFAULT FALSE,
    last_played  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── leaderboard ──────────────────────────────────────────────
CREATE TABLE leaderboard (
    leaderboard_id SERIAL PRIMARY KEY,
    user_id        INT REFERENCES users(user_id) ON DELETE CASCADE,
    country_code   VARCHAR(10),
    total_score    INT DEFAULT 0
);

-- ── game_sessions ────────────────────────────────────────────
CREATE TABLE game_sessions (
    session_id     SERIAL PRIMARY KEY,
    user_id        INT REFERENCES users(user_id) ON DELETE CASCADE,
    country_code   VARCHAR(10) REFERENCES countries(country_code),
    character_name VARCHAR(100),
    final_ending   VARCHAR(100),
    total_score    INT DEFAULT 0,
    started_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at   TIMESTAMP
);


-- ============================================================
-- SEED: COUNTRIES
-- ============================================================
INSERT INTO countries (
    country_code, country_name, flag_emoji,
    starting_money, starting_health, starting_stress, starting_happiness, starting_debt,
    healthcare_cost_mult, education_access_mult, safety_net_mult,
    threshold_stabilized, threshold_survival, threshold_poverty,
    visual_setting, ambient_sound, difficulty_label, intro_text
) VALUES
('us', 'United States', '🇺🇸',
 400, 70, 30, 65, 8000,
 1.8, 1.2, 0.6,
 60, 35, 10,
 'suburban_apartment', 'suburb_ambient', 'Medium',
 'Thomas is working full-time in a low-income suburb of Detroit. Bills are tight but manageable — for now. One bad month could change everything.'),

('in', 'India', '🇮🇳',
 180, 65, 40, 60, 3000,
 0.9, 1.0, 0.5,
 50, 28, 8,
 'urban_dense_apartment', 'city_traffic_ambient', 'Medium',
 'Arjun supports his wife, two children, and his ageing parents on a single income in a crowded Mumbai suburb. Family expectations are high and the margin for error is thin.'),

('ke', 'Kenya', '🇰🇪',
 90, 55, 50, 55, 1500,
 1.5, 0.7, 0.3,
 40, 22, 5,
 'small_concrete_home', 'nairobi_street_ambient', 'Hard',
 'James lives in a small concrete home on the outskirts of Nairobi. Formal employment is scarce. Community ties are strong, but one health crisis could spiral into debt he cannot escape.'),

('se', 'Sweden', '🇸🇪',
 600, 85, 20, 75, 2000,
 0.2, 0.3, 2.0,
 70, 45, 20,
 'modern_minimal_apartment', 'scandinavian_ambient', 'Easier',
 'Erik lives in a clean, modern apartment in Malmö. The welfare state provides a strong safety net, but income inequality is rising and emotional strain is real — even when the bills are covered.'),

('br', 'Brazil', '🇧🇷',
 220, 60, 45, 60, 5000,
 1.2, 0.9, 0.4,
 55, 30, 8,
 'urban_favela_apartment', 'rio_street_ambient', 'Medium-Hard',
 'Lucas lives in a low-income neighbourhood on the edge of São Paulo. Inflation is unpredictable, the city is vibrant but tense, and family bonds are the strongest safety net he has.');


-- ============================================================
-- SEED: SCENARIOS (7 phases, same for all countries)
-- ============================================================
INSERT INTO scenarios (phase_number, title, description, sdg_goal, difficulty) VALUES
(1, 'Phase 1: Financial Stability',
 'You are employed but bills are tight. There is no immediate crisis, but there is no safety net either. Decide how to manage your limited monthly surplus.',
 'SDG 1 – No Poverty', 'Easy'),

(2, 'Phase 2: Income Shock & Side Job',
 'Your regular work hours are cut. Your income is no longer enough to cover all expenses. A side-job opportunity appears — but it comes with trade-offs.',
 'SDG 1 – No Poverty', 'Medium'),

(3, 'Phase 3: Health Crisis',
 'An elderly family member becomes ill and needs medical attention. Treatment is costly. Delaying carries serious long-term risk.',
 'SDG 3 – Good Health', 'Hard'),

(4, 'Phase 4: Family Strain',
 'Your partner is unhappy due to ongoing instability and stress. Neglecting the relationship could have permanent consequences.',
 'SDG 1 – No Poverty', 'Medium'),

(5, 'Phase 5: Long-Term Investment',
 'An opportunity to invest in training or skill development appears. It costs money and time now, but could change your income trajectory.',
 'SDG 4 – Quality Education', 'Medium'),

(6, 'Phase 6: Reflection Checkpoint',
 'Pause and review your journey so far. Open the dashboard to see your financial stability, family well-being, health, and future opportunity scores.',
 'SDG 1 – No Poverty', 'Easy'),

(7, 'Phase 7: Final Outcome',
 'All your decisions are evaluated. Your household reaches one of four possible endings based on the choices you made across every phase.',
 'SDG 1 – No Poverty', 'Hard');


-- ============================================================
-- SEED: DECISIONS (universal — same for all countries)
-- ============================================================

-- Phase 1
INSERT INTO decisions (scenario_id, choice_text, impact_score, economic_score, social_score, health_score) VALUES
(1, 'Save money for emergencies',        10,  15,   5,  0),
(1, 'Spend extra on family comfort',      5,  -5,  15,  5),
(1, 'Do nothing — keep money unused',    -5,   0,   0,  0);

-- Phase 2: Step 1 (take the side job?)
INSERT INTO decisions (scenario_id, choice_text, is_minigame_trigger, impact_score, economic_score, social_score, health_score) VALUES
(2, 'Take the side job and work the shift', TRUE,  10,  20,  -5, -5),
(2, 'Decline the side job',               FALSE, -10, -15,   5,  5),
(2, 'Use savings to cover the shortfall', FALSE,   0, -10,   5,  0);

-- Phase 2: Step 3 (spend the earnings)
INSERT INTO decisions (scenario_id, choice_text, impact_score, economic_score, social_score, health_score) VALUES
(2, 'Use earned money to pay rent',   10,  10,  -5,  0),
(2, 'Use earned money to buy food',    8,  -5,  10, 10),
(2, 'Save the earned money',           5,  15,  -5,  0),
(2, 'Split money across needs poorly', -5,  -5,  -5, -5);

-- Phase 3
INSERT INTO decisions (scenario_id, choice_text, impact_score, economic_score, social_score, health_score) VALUES
(3, 'Pay for treatment immediately',   15, -20,  10,  25),
(3, 'Delay treatment to save money',  -10,  10,  -5, -15),
(3, 'Ignore the illness entirely',    -20,  15, -15, -30);

-- Phase 4
INSERT INTO decisions (scenario_id, choice_text, impact_score, economic_score, social_score, health_score) VALUES
(4, 'Prioritize family needs and time',  10, -10,  20,  5),
(4, 'Focus only on work and income',     -5,  15, -10,  0),
(4, 'Ignore family concerns',           -15,  10, -20, -5);

-- Phase 5
INSERT INTO decisions (scenario_id, choice_text, impact_score, economic_score, social_score, health_score) VALUES
(5, 'Invest in skill development training',  15, -15,  10,  0),
(5, 'Skip the opportunity to save money',   -10,  10,   0,  0);

-- Phase 6 (reflection only)
INSERT INTO decisions (scenario_id, choice_text, impact_score, economic_score, social_score, health_score) VALUES
(6, 'Review KPI dashboard', 0, 0, 0, 0);

-- Phase 7 (resolved server-side)
INSERT INTO decisions (scenario_id, choice_text, impact_score, economic_score, social_score, health_score) VALUES
(7, 'Stabilized Household',                  20,  20,  20, 20),
(7, 'Economic Survival, Social Loss',        10,  20, -15,  5),
(7, 'Cycle of Poverty Continues',           -10, -10, -10,-10),
(7, 'Crisis State — Household Collapses',   -20, -20, -20,-20);


-- ============================================================
-- SEED: COUNTRY EVENTS (5 events per country, phases 1–5)
-- ============================================================

-- ── United States ────────────────────────────────────────────
INSERT INTO country_events (
    country_code, event_phase, event_title, event_description,
    choice_a_text, choice_a_economic, choice_a_social, choice_a_health,
    choice_b_text, choice_b_economic, choice_b_social, choice_b_health,
    choice_c_text, choice_c_economic, choice_c_social, choice_c_health
) VALUES
('us', 1, 'Medical Insurance Gap',
 'Your employer insurance does not cover a routine check-up. The out-of-pocket cost is $200.',
 'Pay it and stay healthy',          -8,  0, 10,
 'Skip the check-up to save money',   8,  0,-10,
 'Look for a free clinic nearby',     0, -3,  5),

('us', 2, 'Overtime Offer',
 'Your manager offers optional overtime at 1.5× pay, but it means missing your child''s school event.',
 'Take the overtime',               15, -8,  0,
 'Attend the school event',        -12, 12,  5,
 NULL, 0, 0, 0),

('us', 3, 'Hospital Billing Dispute',
 'The hospital sends an itemised bill with an error that inflates your charges by $600.',
 'Dispute the bill — takes 2 weeks', -2,  0,  0,
 'Pay the bill to avoid stress',    -18, -5, -5,
 NULL, 0, 0, 0),

('us', 4, 'Community Church Fundraiser',
 'Your neighbourhood church is fundraising to support a family in crisis. Donating builds goodwill.',
 'Donate $50',             -5, 15,  0,
 'Volunteer time instead',  0, 10, -3,
 'Skip it',                 0, -5,  0),

('us', 5, 'Community College Grant',
 'A local community college offers a partial grant for a night-school certification course.',
 'Apply and enrol',                -8,  8,  5,
 'Decline — too tired after work',  0, -5,  0,
 NULL, 0, 0, 0);

-- ── India ─────────────────────────────────────────────────────
INSERT INTO country_events (
    country_code, event_phase, event_title, event_description,
    choice_a_text, choice_a_economic, choice_a_social, choice_a_health,
    choice_b_text, choice_b_economic, choice_b_social, choice_b_health,
    choice_c_text, choice_c_economic, choice_c_social, choice_c_health
) VALUES
('in', 1, 'School Fee Deadline',
 'Your eldest child''s private school sends a fee notice due at end of month.',
 'Pay the school fee on time',          -10,  5,  0,
 'Ask for an extension',                  0, -5,  0,
 'Move child to a government school',     5, -8, -3),

('in', 2, 'Power Outage Affects Income',
 'Rolling power cuts are disrupting your ability to work from home on freelance tasks.',
 'Buy a small inverter on credit',      -10,  5,  0,
 'Work at a nearby internet café',       -5, -2, -5,
 'Lose the freelance work',             -15, -5,  0),

('in', 3, 'Public vs Private Hospital',
 'Your parent needs an MRI. Public hospital has a 6-week wait; private clinic can see them tomorrow at 3× the cost.',
 'Pay for the private clinic now',      -18,  3, 20,
 'Wait for the public hospital',          0, -2,-10,
 'Seek a charitable hospital',           -5,  0,  5),

('in', 4, 'Arranged Marriage Financial Pressure',
 'Extended family is pressuring you to contribute to a cousin''s wedding ceremony.',
 'Contribute ₹10,000',   -8, 12,  0,
 'Attend but not contribute', 0,  3,  0,
 'Decline entirely',          8,-15, -5),

('in', 5, 'Online Upskilling Opportunity',
 'A government-subsidised digital skills programme is available free on weekends.',
 'Enrol in the programme',  0,  8,  0,
 'Skip it — too exhausted', 0, -3, -5,
 NULL, 0, 0, 0);

-- ── Kenya ─────────────────────────────────────────────────────
INSERT INTO country_events (
    country_code, event_phase, event_title, event_description,
    choice_a_text, choice_a_economic, choice_a_social, choice_a_health,
    choice_b_text, choice_b_economic, choice_b_social, choice_b_health,
    choice_c_text, choice_c_economic, choice_c_social, choice_c_health
) VALUES
('ke', 1, 'Drought Spikes Food Prices',
 'A dry spell has pushed maize and vegetable prices up 30% at the local market this week.',
 'Buy in bulk now before prices rise further', -10,  2,  5,
 'Reduce portions and manage',                  5, -5,-10,
 'Join a community food cooperative',           0,  8,  0),

('ke', 2, 'Informal Market Work',
 'A neighbour offers you a day of casual work at the local market — cash in hand but physically demanding.',
 'Take the casual work',          10, -3, -8,
 'Rest and preserve your health', -5,  0,  5,
 NULL, 0, 0, 0),

('ke', 3, 'Micro-Loan Decision',
 'A community SACCO offers you a small emergency loan at 18% annual interest to cover the medical bill.',
 'Take the micro-loan',               10, -2,  0,
 'Ask family to pool money instead',   0, 10,  0,
 'Sell a household asset',             5, -8,  0),

('ke', 4, 'Community Support Trade-Off',
 'Neighbours organise a harambee (community fundraiser) for your family.',
 'Accept community help gratefully', 8, 12,  5,
 'Decline to maintain independence', 0,  0,  0,
 NULL, 0, 0, 0),

('ke', 5, 'Vocational Training Programme',
 'An NGO is offering free carpentry and tailoring training in your neighbourhood for 3 months.',
 'Enrol — it could open new income streams', -3,  5,  3,
 'Cannot afford to take 3 months off',        0, -3,  0,
 NULL, 0, 0, 0);

-- ── Sweden ────────────────────────────────────────────────────
INSERT INTO country_events (
    country_code, event_phase, event_title, event_description,
    choice_a_text, choice_a_economic, choice_a_social, choice_a_health,
    choice_b_text, choice_b_economic, choice_b_social, choice_b_health,
    choice_c_text, choice_c_economic, choice_c_social, choice_c_health
) VALUES
('se', 1, 'Government Assistance Application',
 'You qualify for a housing supplement from the municipality. The application takes 2 hours.',
 'Apply for the supplement',             10,  3,  0,
 'Skip it — not worth the bureaucracy',   0, -2,  0,
 NULL, 0, 0, 0),

('se', 2, 'Childcare Subsidy Renewal',
 'Your maxtaxa (capped childcare) subsidy needs renewal. Missing the deadline means full-price childcare for a month.',
 'Renew it on time',   8,  2,  0,
 'Miss the deadline', -15, -5, -5,
 NULL, 0, 0, 0),

('se', 3, 'Free Healthcare — But Long Wait',
 'The public system will treat your parent for free, but the waiting list is 8 weeks. Private care is available now at SEK 8,000.',
 'Wait for free public healthcare',  0,  0, -8,
 'Pay for private care now',        -18,  3, 15,
 NULL, 0, 0, 0),

('se', 4, 'Integration Programme Offer',
 'The city offers a free integration and language programme that could improve your social network and job prospects.',
 'Join the programme',      0, 12,  5,
 'Decline — already settled', 0, -3,  0,
 NULL, 0, 0, 0),

('se', 5, 'Tax Increase Notice',
 'A small municipal tax increase reduces your monthly take-home by SEK 400.',
 'Accept it — it funds services you use',      -5,  8,  0,
 'Contest it through your union',              -3,  3,  0,
 'Reduce discretionary spending to compensate', 0, -5,  0);

-- ── Brazil ────────────────────────────────────────────────────
INSERT INTO country_events (
    country_code, event_phase, event_title, event_description,
    choice_a_text, choice_a_economic, choice_a_social, choice_a_health,
    choice_b_text, choice_b_economic, choice_b_social, choice_b_health,
    choice_c_text, choice_c_economic, choice_c_social, choice_c_health
) VALUES
('br', 1, 'Inflation Spike',
 'Monthly inflation has jumped. Your grocery bill is 20% higher than last month and savings are worth less.',
 'Buy staple goods in bulk now',           -10,  2,  3,
 'Cut back on food quality',                 5, -5,-10,
 'Find a cheaper neighbourhood market',      0,  3,  0),

('br', 2, 'Informal Gig Economy Work',
 'A delivery app recruiter approaches you. The pay is inconsistent but starts immediately.',
 'Sign up as a delivery rider',          10, -5, -8,
 'Keep looking for stable formal work',  -8,  3,  3,
 NULL, 0, 0, 0),

('br', 3, 'SUS vs Private Clinic',
 'Brazil''s public health system (SUS) is free but overwhelmed. A private clinic can see your parent today.',
 'Use SUS — free but a long wait',  0,  0,-12,
 'Pay for private care',           -15,  3, 18,
 'Try a community health post (UBS)', -3, 2,  5),

('br', 4, 'Community Support Event',
 'Neighbours organise a churrasco (barbecue) fundraiser to help your family.',
 'Attend and accept support gratefully', 5, 15,  5,
 'Decline politely',                     0, -5,  0,
 NULL, 0, 0, 0),

('br', 5, 'SENAI Technical Training',
 'SENAI is offering a free welding and electrical certification course.',
 'Enrol in the course',                  -3,  8,  3,
 'Cannot fit it into your schedule',      0, -3,  0,
 NULL, 0, 0, 0);
```

---

## `.env` (create this yourself, never commit it)
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=household_survival
DB_USER=postgres
DB_PASSWORD=yourpassword
JWT_SECRET=some_very_long_random_secret_here
JWT_EXPIRES_IN=7d
PORT=3000