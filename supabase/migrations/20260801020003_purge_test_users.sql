-- Tozalash: mod_login test foydalanuvchilari
DELETE FROM public.profiles WHERE email IN ('modtestfinal@mailinator.com', 'modtest947699@mailinator.com', 'modtest285455@mailinator.com', 'modtest591594@mailinator.com', 'modtest572402@mailinator.com');
DELETE FROM auth.users WHERE email IN ('modtestfinal@mailinator.com', 'modtest947699@mailinator.com', 'modtest285455@mailinator.com', 'modtest591594@mailinator.com', 'modtest572402@mailinator.com');
