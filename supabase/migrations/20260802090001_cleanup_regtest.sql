-- register-account sinov akkountlarini tozalash
delete from auth.users where email like 'regtest%@example.com';
delete from public.registration_ips where email like 'regtest%@example.com';
