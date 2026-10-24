ALTER TABLE attractions ADD COLUMN deleted_at TEXT;
ALTER TABLE events ADD COLUMN deleted_at TEXT;
ALTER TABLE notices ADD COLUMN deleted_at TEXT;

CREATE TABLE audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_email TEXT NOT NULL,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id INTEGER,
  detail TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_audit_created ON audit_log(created_at);

CREATE TABLE seasons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('alta','baixa','fechada')),
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  attraction_id INTEGER REFERENCES attractions(id) ON DELETE SET NULL,
  notes TEXT NOT NULL DEFAULT '',
  deleted_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_seasons_dates ON seasons(start_date, end_date);

INSERT INTO attractions (slug, name, category, summary, description, location, difficulty, status, safety_notes, image_key, image_credit, featured) VALUES
('parque-nacional-serra-dos-orgaos', 'Parque Nacional da Serra dos Órgãos', 'parque',
 'A maior referência do montanhismo brasileiro, com picos, trilhas e mata atlântica preservada.',
 'Unidade de conservação federal que protege parte da Serra dos Órgãos. Na sede de Teresópolis ficam as portarias, trilhas e o acesso a destinos como a Pedra do Sino e o Dedo de Deus.',
 'Teresópolis', 'moderada', 'aberta',
 'Consulte horários, regras e a necessidade de agendamento diretamente com o parque antes de visitar.',
 'img/parnaso.jpg', 'Foto: Allancarvlho · CC BY-SA 4.0 · Wikimedia Commons', 1);

INSERT INTO seasons (name, kind, start_date, end_date, attraction_id, notes) VALUES
('Alta temporada de verão', 'alta', '2026-12-20', '2027-02-28', NULL, 'Maior movimento: chegue cedo e planeje a visita com antecedência.'),
('Alta temporada de inverno', 'alta', '2027-06-15', '2027-08-15', NULL, 'Dias claros e secos atraem montanhistas; reserve com antecedência.'),
('Manutenção das trilhas da Pedra do Sino', 'fechada', '2027-03-01', '2027-03-15', (SELECT id FROM attractions WHERE slug = 'pedra-do-sino'), 'Exemplo: fechamento programado para manutenção.');
