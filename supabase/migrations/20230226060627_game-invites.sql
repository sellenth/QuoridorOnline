-- Game invites table
CREATE TABLE "public"."game-invites" (
    initiator_id  uuid      NOT NULL,
    opponent_id   uuid      NOT NULL,
    rows          int   not null default 9,
    cols          int   not null default 9,
    layers        int   not null default 3,
    gid           uuid      default null REFERENCES games,
    initiated DATE      default CURRENT_DATE,
    --
    CONSTRAINT Invite_PK   PRIMARY KEY (initiator_id, opponent_id), -- Composite PRIMARY KEY.
    CONSTRAINT OpponentToUser_FK FOREIGN KEY (opponent_id)
        REFERENCES "public"."users" (id),
    CONSTRAINT InitiatorToUser_FK FOREIGN KEY (initiator_id)
        REFERENCES "public"."users" (id),
    CONSTRAINT UsersAreDistinct_CK    CHECK (initiator_id <> opponent_id)
);
alter table "public"."game-invites" enable row level security;
alter publication supabase_realtime add table "public"."game-invites";


CREATE INDEX "my_invites" ON public."game-invites" USING btree (initiator_id);

CREATE INDEX "invites_for_me" ON public."game-invites" USING btree (opponent_id);

create policy "enable everything on game-invites table for authenticated users"
on "public"."game-invites"
as permissive FOR ALL
to authenticated
USING (true)
WITH CHECK (true);
