-- VAQTINCHALIK test: IP BAN ishlashini isbotlash (45.153.60.102 adminning IP'si)
insert into public.blocked_ips (ip, note) values ('45.153.60.102', 'temp test: ban proof')
on conflict (ip) do nothing;
