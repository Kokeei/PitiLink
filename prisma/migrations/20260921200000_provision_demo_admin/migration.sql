-- Provisionne le compte administrateur de démonstration afin qu'une base déjà initialisée puisse aussi le recevoir.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO "users" (
  "id",
  "email",
  "passwordHash",
  "nom",
  "prenom",
  "role",
  "garderieId",
  "createdAt",
  "updatedAt"
)
SELECT
  'admin-platform-demo',
  'admin.demo@pitilink.local',
  crypt('Password123!', gen_salt('bf', 10)),
  'PitiLink',
  'Admin',
  'ADMIN_PLATEFORME'::"Role",
  NULL,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
WHERE NOT EXISTS (
  SELECT 1 FROM "users" WHERE "email" = 'admin.demo@pitilink.local'
);