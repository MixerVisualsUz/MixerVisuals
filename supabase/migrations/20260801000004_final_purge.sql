/*
# Mixer Visuals — Yakuniy tozalash

Test kalit va barcha test foydalanuvchilari o'chiriladi.
Baza toza — keyingi ro'yxatdan o'tgan ADMIN bo'ladi.
*/

DELETE FROM public.license_keys WHERE code = 'MV-TESTKEY-0001';

DELETE FROM auth.users WHERE email LIKE '%@mailinator.com';

DELETE FROM public.profiles p
WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = p.id);
