create table "public"."games" (
    "id"          uuid not null,
    "move_num"    integer default 0,
    "p1_id"       uuid,
    "p2_id"       uuid,
    "moves"       smallint[],

    rows          int   not null default 9,
    cols          int   not null default 9,
    layers        int   not null default 3,
    start_fences  int   not null default 15
);
alter table "public"."games" enable row level security;

create table "public"."users" (
    "id" uuid unique not null,
    "username" text unique not null,
    "member_since" date default CURRENT_DATE,
    "elo" integer default 400,
    "email" text not null
);
alter table "public"."users" enable row level security;


CREATE TABLE "public"."friends" (
    user_id       uuid      NOT NULL,
    friend_id     uuid      NOT NULL,
    accepted      bool      default false,
    friends_since DATE      default CURRENT_DATE,
    --
    CONSTRAINT Friendship_PK   PRIMARY KEY (user_id, friend_id), -- Composite PRIMARY KEY.
    CONSTRAINT UserToFriend_FK FOREIGN KEY (friend_id)
        REFERENCES "public"."users" (id),
    CONSTRAINT FriendToUser_FK FOREIGN KEY (user_id)
        REFERENCES "public"."users" (id),
    CONSTRAINT FriendsAreDistinct_CK    CHECK (user_id <> friend_id)
);
alter table "public"."friends" enable row level security;



-- Games related
CREATE UNIQUE INDEX "games_pkey" ON public."games" USING btree (id);

alter table "public"."games" add constraint "games_pkey" PRIMARY KEY using index "games_pkey";
-- /Games related


-- friends related
CREATE INDEX "my_friends" ON public."friends" USING btree (user_id);

CREATE INDEX "friends_with_me" ON public."friends" USING btree (friend_id);
-- /friends related


-- users related
CREATE UNIQUE INDEX users_pkey ON public.users USING btree (id);

alter table "public"."users" add constraint "users_pkey" PRIMARY KEY using index "users_pkey";

alter table "public"."users" add constraint "users_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."users" validate constraint "users_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
begin
  insert into public.users (id, email, username)
  values (new.id, new.email, new.raw_user_meta_data->>'preferred_username');
  return new;
end;
$function$
;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
-- /users related