-- Test IP'ni bloklistdan olib tashlash (tekshiruv tugadi)
delete from public.blocked_ips where ip = '45.153.60.102' and note = 'temp test: ban proof';
