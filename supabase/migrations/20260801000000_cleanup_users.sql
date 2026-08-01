/*
# Mixer Visuals — Orfans profillar va test foydalanuvchilarni tozalash

Auth usersi bo'lmagan (orfans) profil qatorlari admin tayinlashni buzadi.
Test foydalanuvchilari ham o'chiriladi — keyingi ro'yxatdan o'tgan admin bo'ladi.
*/

DELETE FROM public.profiles p
WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = p.id);

DELETE FROM auth.users WHERE email LIKE 'test%@mailinator.com';
