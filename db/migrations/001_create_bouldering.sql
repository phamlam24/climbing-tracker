CREATE SCHEMA IF NOT EXISTS climbing;

CREATE TABLE climbing.bouldering (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  grade      text NOT NULL,
  tags       text[] NOT NULL DEFAULT '{}',
  media_url  text NOT NULL DEFAULT '',
  notes      text NOT NULL DEFAULT '',
  date       date NOT NULL
);

CREATE INDEX idx_bouldering_date ON climbing.bouldering (date);
