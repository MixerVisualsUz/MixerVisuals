-- Test: mod_login tekshiruvi uchun vaqtinchalik foydalanuvchi
-- (GoTrue signup rate limitini chetlab o'tish uchun to'g'ridan-to'g'ri yaratamiz)
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at, raw_user_meta_data,
  confirmation_token, recovery_token, email_change_token_new, email_change
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  extensions.gen_random_uuid(),
  'authenticated', 'authenticated', 'modtestfinal@mailinator.com',
  extensions.crypt('Test12345!', extensions.gen_salt('bf')),
  now(), now(), now(), '{"username":"modtestfinal"}',
  '', '', '', ''
);
