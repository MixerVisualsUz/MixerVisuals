-- VAQTINCHALIK: audit log umumiy tarkibi
create or replace view public.v_gemini_signup_ips as
select id, ip_address, payload, created_at
from auth.audit_log_entries
order by created_at desc
limit 100;
grant select on public.v_gemini_signup_ips to anon;
