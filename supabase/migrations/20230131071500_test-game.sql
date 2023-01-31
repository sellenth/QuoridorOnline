create policy "Enable read access for all users"
on "public"."test-game"
as permissive
for select
to public
using (true);



