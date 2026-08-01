/*
# Mixer Visuals — Eski test foydalanuvchilarni tozalash (2-marta)

muxammaddintairov01@gmail.com — eski test akkount (admin roli bilan qolib ketgan).
Test akkountlar o'chiriladi, keyingi haqiqiy ro'yxatdan o'tgan admin bo'ladi.
*/

DELETE FROM auth.users WHERE email = 'muxammaddintairov01@gmail.com';
DELETE FROM auth.users WHERE email LIKE 'test%@mailinator.com';
