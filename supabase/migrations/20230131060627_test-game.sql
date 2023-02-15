create table "public"."games" (
    "id" uuid not null,
    "move_num" integer default 0,
    "p1_id" uuid,
    "p2_id" uuid,
    "moves" smallint[]
);

alter table "public"."games" enable row level security;

create table "public"."users" (
    "id" uuid not null,
    "username" text not null,
    "member_since" date default CURRENT_DATE,
    "elo" integer default 400,
    "email" text not null
);


alter table "public"."users" enable row level security;

CREATE UNIQUE INDEX "games_pkey" ON public."games" USING btree (id);

CREATE UNIQUE INDEX users_pkey ON public.users USING btree (id);

alter table "public"."games" add constraint "games_pkey" PRIMARY KEY using index "games_pkey";

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
