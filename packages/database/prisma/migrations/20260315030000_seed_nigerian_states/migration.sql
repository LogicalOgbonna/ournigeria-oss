-- Seed nigerian_states with all 36 states + FCT
-- Uses ON CONFLICT to be idempotent (safe to re-run)

INSERT INTO "nigerian_states" ("code", "name", "geopolitical_zone", "capital") VALUES
  -- North Central
  ('benue',        'Benue',        'North Central',  'Makurdi'),
  ('kogi',         'Kogi',         'North Central',  'Lokoja'),
  ('kwara',        'Kwara',        'North Central',  'Ilorin'),
  ('nasarawa',     'Nasarawa',     'North Central',  'Lafia'),
  ('niger',        'Niger',        'North Central',  'Minna'),
  ('plateau',      'Plateau',      'North Central',  'Jos'),
  ('fct',          'FCT',          'North Central',  'Abuja'),

  -- North East
  ('adamawa',      'Adamawa',      'North East',     'Yola'),
  ('bauchi',       'Bauchi',       'North East',     'Bauchi'),
  ('borno',        'Borno',        'North East',     'Maiduguri'),
  ('gombe',        'Gombe',        'North East',     'Gombe'),
  ('taraba',       'Taraba',       'North East',     'Jalingo'),
  ('yobe',         'Yobe',         'North East',     'Damaturu'),

  -- North West
  ('jigawa',       'Jigawa',       'North West',     'Dutse'),
  ('kaduna',       'Kaduna',       'North West',     'Kaduna'),
  ('kano',         'Kano',         'North West',     'Kano'),
  ('katsina',      'Katsina',      'North West',     'Katsina'),
  ('kebbi',        'Kebbi',        'North West',     'Birnin Kebbi'),
  ('sokoto',       'Sokoto',       'North West',     'Sokoto'),
  ('zamfara',      'Zamfara',      'North West',     'Gusau'),

  -- South East
  ('abia',         'Abia',         'South East',     'Umuahia'),
  ('anambra',      'Anambra',      'South East',     'Awka'),
  ('ebonyi',       'Ebonyi',       'South East',     'Abakaliki'),
  ('enugu',        'Enugu',        'South East',     'Enugu'),
  ('imo',          'Imo',          'South East',     'Owerri'),

  -- South South
  ('akwa_ibom',    'Akwa Ibom',    'South South',    'Uyo'),
  ('bayelsa',      'Bayelsa',      'South South',    'Yenagoa'),
  ('cross_river',  'Cross River',  'South South',    'Calabar'),
  ('delta',        'Delta',        'South South',    'Asaba'),
  ('edo',          'Edo',          'South South',    'Benin City'),
  ('rivers',       'Rivers',       'South South',    'Port Harcourt'),

  -- South West
  ('ekiti',        'Ekiti',        'South West',     'Ado-Ekiti'),
  ('lagos',        'Lagos',        'South West',     'Ikeja'),
  ('ogun',         'Ogun',         'South West',     'Abeokuta'),
  ('ondo',         'Ondo',         'South West',     'Akure'),
  ('osun',         'Osun',         'South West',     'Osogbo'),
  ('oyo',          'Oyo',          'South West',     'Ibadan')
ON CONFLICT ("code") DO NOTHING;
