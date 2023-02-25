create policy "Enable read access for all users"
on "public"."games"
as permissive
for select
to public
using (true);

CREATE POLICY "can update table" ON "public"."games"
AS PERMISSIVE FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true)