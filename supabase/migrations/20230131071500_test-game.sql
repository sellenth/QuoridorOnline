create policy "Enable read access on users table for all users"
on "public"."users"
as permissive
for select
to public
using (true);

create policy "enable everything on friends table for authenticated users"
on "public"."friends"
as permissive FOR ALL
to authenticated
USING (true)
WITH CHECK (true);

create policy "Enable read access on games table for games all users"
on "public"."games"
as permissive
for select
to public
using (true);

CREATE POLICY "can update table"
ON "public"."games"
AS PERMISSIVE FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true)