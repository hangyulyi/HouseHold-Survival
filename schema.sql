-- ============================================================
-- Household Survival — PostgreSQL Database Schema (D2)
-- SDG 1: No Poverty | SENG 401
-- ============================================================

-- Step 1: Create the database (run this line alone first in psql)
-- CREATE DATABASE household_survival;

-- Step 2: Run the rest in psql connected to household_survival

-- ============================================================
-- TABLE 1: users
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    user_id       SERIAL PRIMARY KEY,
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLE 2: scenarios
-- ============================================================
CREATE TABLE IF NOT EXISTS scenarios (
    scenario_id SERIAL PRIMARY KEY,
    title       VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    sdg_goal    VARCHAR(50),
    difficulty  VARCHAR(50)
);

-- ============================================================
-- TABLE 3: decisions
-- ============================================================
CREATE TABLE IF NOT EXISTS decisions (
    decision_id         SERIAL PRIMARY KEY,
    scenario_id         INT REFERENCES scenarios(scenario_id) ON DELETE CASCADE,
    choice_text         TEXT NOT NULL,
    impact_score        INT,
    environmental_score INT,
    economic_score      INT,
    social_score        INT
);

-- ============================================================
-- TABLE 4: player_progress
-- ============================================================
CREATE TABLE IF NOT EXISTS player_progress (
    progress_id SERIAL PRIMARY KEY,
    user_id     INT REFERENCES users(user_id) ON DELETE CASCADE,
    scenario_id INT REFERENCES scenarios(scenario_id),
    score       INT DEFAULT 0,
    completed   BOOLEAN DEFAULT FALSE,
    last_played TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLE 5: leaderboard
-- ============================================================
CREATE TABLE IF NOT EXISTS leaderboard (
    leaderboard_id SERIAL PRIMARY KEY,
    user_id        INT REFERENCES users(user_id),
    total_score    INT DEFAULT 0
);

-- ============================================================
-- SEED DATA — Scenarios (7 phases from game blueprint)
-- ============================================================
INSERT INTO scenarios (title, description, sdg_goal, difficulty) VALUES
(
    'Phase 1: Financial Stability',
    'Thomas is employed but bills are tight. No crisis yet, but no safety net either. Decide how to manage your limited surplus.',
    'SDG 1 – No Poverty', 'Easy'
),
(
    'Phase 2: Income Shock & Pizzeria',
    'Thomas''s hours are cut. He considers taking a side job at a local pizzeria to cover the shortfall.',
    'SDG 1 – No Poverty', 'Medium'
),
(
    'Phase 3: Health Crisis',
    'Thomas''s elderly parent becomes ill and needs medical attention. Treatment is costly but delays carry serious risk.',
    'SDG 3 – Good Health', 'Hard'
),
(
    'Phase 4: Family Strain',
    'Emily is unhappy due to ongoing financial stress. Neglecting family relationships could have permanent consequences.',
    'SDG 1 – No Poverty', 'Medium'
),
(
    'Phase 5: Long-Term Investment',
    'Thomas has an opportunity to invest in skill development training. Short-term cost, potential long-term gain.',
    'SDG 4 – Quality Education', 'Medium'
),
(
    'Phase 6: Reflection Checkpoint',
    'Thomas pauses to review his financial stability, family well-being, health, and future opportunity scores.',
    'SDG 1 – No Poverty', 'Easy'
),
(
    'Phase 7: Final Outcome',
    'All decisions are evaluated. Thomas''s household reaches one of four possible endings based on accumulated choices.',
    'SDG 1 – No Poverty', 'Hard'
);

-- ============================================================
-- SEED DATA — Decisions per Scenario
-- ============================================================

-- Phase 1: Financial Stability
INSERT INTO decisions (scenario_id, choice_text, impact_score, environmental_score, economic_score, social_score) VALUES
(1, 'Save money for emergencies',              10,  0,  15,  5),
(1, 'Spend extra on family comfort',            5,  0,  -5, 15),
(1, 'Do nothing — keep money unused',          -5,  0,   0,  0);

-- Phase 2: Income Shock
INSERT INTO decisions (scenario_id, choice_text, impact_score, environmental_score, economic_score, social_score) VALUES
(2, 'Take the pizzeria job and work the shift', 10,  0,  20, -5),
(2, 'Decline the side job',                    -10,  0, -15,  5),
(2, 'Use savings to cover the shortfall',        0,  0, -10,  5);

-- Phase 2 income allocation (sub-decisions after pizzeria)
INSERT INTO decisions (scenario_id, choice_text, impact_score, environmental_score, economic_score, social_score) VALUES
(2, 'Use earned money to pay rent',              10,  0,  10, -5),
(2, 'Use earned money to buy food',               8,  5,  -5, 10),
(2, 'Save the earned money',                      5,  0,  15, -5),
(2, 'Split money across needs poorly',           -5,  0,  -5, -5);

-- Phase 3: Health Crisis
INSERT INTO decisions (scenario_id, choice_text, impact_score, environmental_score, economic_score, social_score) VALUES
(3, 'Pay for treatment immediately',             15,  0, -20, 10),
(3, 'Delay treatment to save money',            -10,  0,  10, -5),
(3, 'Ignore the illness entirely',              -20,  0,  15,-15);

-- Phase 4: Family Strain
INSERT INTO decisions (scenario_id, choice_text, impact_score, environmental_score, economic_score, social_score) VALUES
(4, 'Prioritize family needs and time',          10,  0, -10, 20),
(4, 'Focus only on work and income',             -5,  0,  15, -10),
(4, 'Ignore family concerns',                   -15,  0,  10, -20);

-- Phase 5: Long-Term Investment
INSERT INTO decisions (scenario_id, choice_text, impact_score, environmental_score, economic_score, social_score) VALUES
(5, 'Invest in skill development training',      15,  5, -15, 10),
(5, 'Skip the opportunity to preserve money',   -10,  0,  10,  0);

-- Phase 6: Reflection (no decisions — view only)
INSERT INTO decisions (scenario_id, choice_text, impact_score, environmental_score, economic_score, social_score) VALUES
(6, 'Review KPI dashboard',                       0,  0,   0,  0);

-- Phase 7: Final Outcome (system evaluates automatically)
INSERT INTO decisions (scenario_id, choice_text, impact_score, environmental_score, economic_score, social_score) VALUES
(7, 'Stabilized Household',                      20,  5,  20, 20),
(7, 'Economic Survival, Social Loss',            10,  0,  20,-15),
(7, 'Cycle of Poverty Continues',               -10,  0, -10,-10),
(7, 'Crisis State — Household Collapses',       -20,  0, -20,-20);