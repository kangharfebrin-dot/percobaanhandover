-- DIGIHandover - Injeksi Data Akun SUPER_ADMIN
-- Password default: SuperAdmin123!
-- Bcrypt Hash: $2b$10$uFShYvap2CTZyL1WdTDgs.pyHBvk7b9K1785uxJOr.5IgzOf.lO8C

INSERT INTO user (id, username, password, role, name, jabatan, createdAt, updatedAt)
VALUES (
  'superadmin-master-id',
  'superadmin',
  '$2b$10$uFShYvap2CTZyL1WdTDgs.pyHBvk7b9K1785uxJOr.5IgzOf.lO8C',
  'SUPER_ADMIN',
  'Super Administrator',
  'Super Administrator Pusat',
  NOW(),
  NOW()
)
ON DUPLICATE KEY UPDATE 
  role = 'SUPER_ADMIN',
  password = '$2b$10$uFShYvap2CTZyL1WdTDgs.pyHBvk7b9K1785uxJOr.5IgzOf.lO8C',
  name = 'Super Administrator',
  jabatan = 'Super Administrator Pusat',
  deletedAt = NULL,
  updatedAt = NOW();

