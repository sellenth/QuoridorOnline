create policy "Enable read access for all users"
on "public"."games"
as permissive
for select
to public
using (true);



