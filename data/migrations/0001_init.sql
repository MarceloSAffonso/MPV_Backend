CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE attractions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('trilha','cachoeira','mirante','parque','biodiversidade')),
  summary TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL,
  difficulty TEXT CHECK (difficulty IN ('facil','moderada','dificil')),
  distance_km REAL,
  duration TEXT,
  altitude_m INTEGER,
  status TEXT NOT NULL DEFAULT 'aberta' CHECK (status IN ('aberta','fechada','manutencao')),
  safety_notes TEXT NOT NULL DEFAULT '',
  image_key TEXT,
  featured INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_attractions_category ON attractions(category);
CREATE INDEX idx_attractions_status ON attractions(status);

CREATE TABLE events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('caminhada','voluntariado','cultura','gastronomia','educacao')),
  status TEXT NOT NULL DEFAULT 'rascunho' CHECK (status IN ('publicado','rascunho')),
  image_key TEXT,
  attraction_id INTEGER REFERENCES attractions(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_events_date ON events(date);
CREATE INDEX idx_events_status ON events(status);

CREATE TABLE notices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info','alerta','urgente')),
  attraction_id INTEGER REFERENCES attractions(id) ON DELETE SET NULL,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_notices_active ON notices(active);
