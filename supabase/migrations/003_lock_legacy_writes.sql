-- This release writes exclusively through save_app_records. The normalized tables
-- from 001 are reserved for a later migration and must not form a second write path.
revoke insert,update,delete on public.baustellen,public.baustellen_team,
 public.tageschecks,public.zonenzutritte,public.journale,public.dokumente,public.maengel
 from anon,authenticated;
