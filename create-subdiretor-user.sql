-- Criar usuário subdiretor_saude para teste
INSERT INTO "User" (id, email, cpf, password, name, role, "organizationId", "createdAt")
VALUES (
  gen_random_uuid(),
  'subdiretor@teste.com',
  '12345678900',
  '$2a$10$8K9wE4nFcHKUuWJ3f7Z/4OIHr4KJv4oRJdZOzBfLTg8cGvQVgVdAu', -- senha: 123456
  'Subdiretor de Saúde Teste',
  'SUBDIRETOR_SAUDE',
  (SELECT id FROM "Organization" LIMIT 1),
  NOW()
) ON CONFLICT (email) DO NOTHING;
