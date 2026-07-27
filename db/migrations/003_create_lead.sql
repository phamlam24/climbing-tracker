CREATE TABLE climbing.lead (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  grade      text NOT NULL,
  tags       text[] NOT NULL DEFAULT '{}',
  media_url  text NOT NULL DEFAULT '',
  notes      text NOT NULL DEFAULT '',
  date       date NOT NULL,
  favorite   boolean NOT NULL DEFAULT false
);

CREATE INDEX idx_lead_date ON climbing.lead (date);
