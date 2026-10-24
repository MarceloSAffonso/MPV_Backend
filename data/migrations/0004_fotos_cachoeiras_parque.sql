UPDATE attractions SET
  slug = 'cachoeira-do-papel',
  name = 'Cachoeira do Papel',
  summary = 'Queda d''água na trilha da Pedra do Sino, em meio à mata atlântica.',
  description = 'Uma das belezas do caminho até a Pedra do Sino, a Cachoeira do Papel desce por paredões de pedra cobertos de musgo, cercada de mata atlântica. É uma ótima parada para descansar e fotografar durante a subida.',
  location = 'Parque Nacional da Serra dos Órgãos · Teresópolis',
  difficulty = 'moderada',
  distance_km = NULL, duration = NULL, altitude_m = NULL,
  safety_notes = 'Está na trilha da Pedra do Sino: leve água, agasalho e siga as regras do parque. As pedras molhadas são escorregadias.',
  image_key = 'img/cachoeira-papel.jpg',
  image_credit = 'Foto: TMbux · CC BY-SA 3.0 · Wikimedia Commons'
WHERE slug = 'cachoeira-veu-da-noiva';

UPDATE attractions SET
  slug = 'cascata-sede-teresopolis',
  name = 'Cascata da Sede Teresópolis',
  summary = 'Cascata de águas escuras e frescas, escondida na mata da sede de Teresópolis do parque nacional.',
  description = 'Pequena queda d''água entre rochas e vegetação, na área da sede de Teresópolis do Parque Nacional da Serra dos Órgãos. Um refúgio de sombra e água fresca para quem faz caminhadas leves.',
  location = 'Parque Nacional da Serra dos Órgãos · Teresópolis',
  image_key = 'img/cachoeira-sede.jpg',
  image_credit = 'Foto: Giovani Livio · CC BY-SA 3.0 · Wikimedia Commons'
WHERE slug = 'poco-do-presidente';

UPDATE notices SET
  title = 'Cascata da Sede Teresópolis em manutenção',
  message = 'O acesso está temporariamente em manutenção. Confira o status antes de sair de casa.'
WHERE attraction_id = (SELECT id FROM attractions WHERE slug = 'cascata-sede-teresopolis');

UPDATE attractions SET
  image_key = 'img/pnmmt.jpg',
  image_credit = 'Foto: Tedd Santana · CC BY-SA 2.0 · Wikimedia Commons'
WHERE slug = 'parque-natural-municipal-montanhas';
