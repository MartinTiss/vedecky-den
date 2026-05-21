-- db/schema.sql

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DROP TABLE IF EXISTS answers CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS players CASCADE;

CREATE TABLE players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nickname text NOT NULL,
  score int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE questions (
  id serial PRIMARY KEY,
  text text NOT NULL,
  accepted_answers jsonb NOT NULL
);

CREATE TABLE answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  question_id int NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  answer_text text NOT NULL,
  is_correct boolean NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;

-- Players: allow anonymous insert and select of own profile
CREATE POLICY "players_insert_anon" ON players
  FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "players_select_self" ON players
  FOR SELECT TO anon
  USING (
    id = auth.uid()
    OR id = (current_setting('request.jwt.claims', true)::jsonb ->> 'player_id')::uuid
  );

-- Questions: public read of id + text only
CREATE POLICY "questions_select_public" ON questions
  FOR SELECT TO anon
  USING (true);

REVOKE SELECT (accepted_answers) ON questions FROM PUBLIC;
REVOKE SELECT (accepted_answers) ON questions FROM anon;
REVOKE SELECT (accepted_answers) ON questions FROM authenticated;

-- Answers: allow anonymous insert
CREATE POLICY "answers_insert_anon" ON answers
  FOR INSERT TO anon
  WITH CHECK (true);

-- Explicit grants for anon role
REVOKE ALL ON players FROM anon, authenticated, PUBLIC;
REVOKE ALL ON questions FROM anon, authenticated, PUBLIC;
REVOKE ALL ON answers FROM anon, authenticated, PUBLIC;

GRANT INSERT, SELECT ON players TO anon;
GRANT SELECT (id, text) ON questions TO anon;
GRANT INSERT ON answers TO anon;
