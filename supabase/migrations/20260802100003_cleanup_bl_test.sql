-- Test akkountni tozalash (bloklist sinovi)
delete from public.registration_ips where email = 'testnormaluser_qw1@gmail.com';
delete from public.profiles where email = 'testnormaluser_qw1@gmail.com';
delete from auth.users where email = 'testnormaluser_qw1@gmail.com';
