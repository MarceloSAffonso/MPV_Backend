ALTER TABLE attractions ADD COLUMN image_credit TEXT;

UPDATE attractions SET image_key = 'img/pedra-do-sino.jpg',
  image_credit = 'Foto: Marinelson Almeida · CC BY 2.0 · Wikimedia Commons' WHERE slug = 'pedra-do-sino';
UPDATE attractions SET image_key = 'img/dedo-de-deus.jpg',
  image_credit = 'Foto: Rogério Santana · CC BY 2.0 BR · Wikimedia Commons' WHERE slug = 'dedo-de-deus';
UPDATE attractions SET image_key = 'img/tres-picos.jpg',
  image_credit = 'Foto: Giojva · CC BY-SA 4.0 · Wikimedia Commons' WHERE slug = 'parque-estadual-tres-picos';
UPDATE attractions SET image_key = 'img/aves.jpg',
  image_credit = 'Foto: Mateus de Mattos Sales (tiê-de-topete, Serra dos Órgãos) · CC BY-SA 4.0 · Wikimedia Commons' WHERE slug = 'aves-da-mata-atlantica';
