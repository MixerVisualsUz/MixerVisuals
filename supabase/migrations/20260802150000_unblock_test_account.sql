-- Test uchun bloklangan akkountni ochish: muxammaddintairov01@gmail.com
delete from public.blocked_emails where email = 'muxammaddintairov01@gmail.com';

delete from public.blocked_ips
where note ilike '%muxammaddintairov01%'
   or ip in (select ip from public.registration_ips where email = 'muxammaddintairov01@gmail.com');

update public.profiles set blocked = false where email = 'muxammaddintairov01@gmail.com';
