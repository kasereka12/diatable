-- ──────────────────────────────────────────────────────
-- Remove fictitious demo data that was seeded by the initial
-- 20260321000000_init.sql migration (restaurants like "Chez Fatou",
-- "Dragon Palace"... and matching testimonials). Safe to run on any
-- environment: it only targets these exact, unmistakably fictitious
-- names and is a no-op if they were never inserted (e.g. fresh installs
-- created after the seed was removed from the init migration).
-- ──────────────────────────────────────────────────────

delete from restaurants
where name in (
  'Chez Fatou — Saveurs du Sénégal',
  'Dragon Palace — Chef Wei',
  'Beit Beirut — Mezze & Grills',
  'Damas Kitchen — Shawarma & Plus',
  'Maison Dupont — Boulangerie',
  'Mama Chidi''s — Jollof & Soul',
  'Spice Route — Chef Priya',
  'Trattoria Romano — Pasta & Vino',
  'Rio Sabor — Feijoada & Caipi'
);

delete from testimonials
where (initials, name) in (
  ('AS', 'Aminata S.'),
  ('KM', 'Karim M.'),
  ('ZW', 'Zhang Wei')
);
