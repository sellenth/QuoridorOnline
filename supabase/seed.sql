-- helpful: https://github.com/supabase/supabase/discussions/5248#discussioncomment-4610297
WITH credentials(uid, mail, pass, extra_data) AS (
  -- PUT YOUR EMAILS AND PASSWORDS HERE.
  SELECT * FROM (VALUES
  ('13375757-eee0-4e53-9246-2bc83ffcac54'::uuid, 'halston@sellent.in', 'password', '{ "preferred_username": "gamer" }'::jsonb),
  ('abcdbbfc-577b-4b39-b68d-4b1bc89e4a2f'::uuid, 'bobo@gmail.com', 'password', '{ "preferred_username": "player one" }'::jsonb),
  ('deadbeef-577b-4b39-b68d-4b1bc89e4a2f'::uuid, 'tmp@gmail.com', 'password', '{ "preferred_username": "placeholder" }'::jsonb)
  ) AS users
),
create_user AS (
  INSERT INTO auth.users (id, instance_id, ROLE, aud, email, raw_app_meta_data, raw_user_meta_data, is_super_admin, encrypted_password, created_at, updated_at, last_sign_in_at, email_confirmed_at, confirmation_sent_at, confirmation_token, recovery_token, email_change_token_new, email_change)
    SELECT  uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', mail, '{"provider":"email","providers":["email"]}', extra_data, FALSE, crypt(pass, gen_salt('bf')), NOW(), NOW(), NOW(), NOW(), NOW(), '', '', '', '' FROM credentials
  RETURNING id
)
INSERT INTO auth.identities (id, provider, user_id, identity_data, last_sign_in_at, created_at, updated_at)
  SELECT id, 'email', id, json_build_object('sub', id), NOW(), NOW(), NOW() FROM create_user;


-- creating a game
insert into public."games" (id, move_num, p1_id, p2_id, moves, winner, rows, cols, layers)
(
values
  ('88085757-eee0-4e53-9246-2bc83ffcac54', 5,'abcdbbfc-577b-4b39-b68d-4b1bc89e4a2f', '13375757-eee0-4e53-9246-2bc83ffcac54', '{{2,8,0,0},{1,8,0,6},{0,9,3,3}, {0, 9, 3, 5}}', null, 10, 8, 3),
  ('80085757-eee0-4e53-9246-2bc83ffcac54', 5,'abcdbbfc-577b-4b39-b68d-4b1bc89e4a2f', '13375757-eee0-4e53-9246-2bc83ffcac54', '{{2,8,0,0},{1,8,0,6},{0,9,3,3}, {0, 9, 3, 5}}', null, 10, 8, 2),
  ('a3a33757-eee0-4e53-9246-2bc83ffcac54', 5,'abcdbbfc-577b-4b39-b68d-4b1bc89e4a2f', '13375757-eee0-4e53-9246-2bc83ffcac54', '{{2,8,0,0},{2,10,0,0},{3,8,4,0},{0,9,3,15},{0,9,3,3}}', '13375757-eee0-4e53-9246-2bc83ffcac54', 9, 9, 3)
);


-- creating some friend relations
insert into public."friends" (user_id, friend_id, accepted)
(values
  ('abcdbbfc-577b-4b39-b68d-4b1bc89e4a2f', '13375757-eee0-4e53-9246-2bc83ffcac54', false),
  ('deadbeef-577b-4b39-b68d-4b1bc89e4a2f', '13375757-eee0-4e53-9246-2bc83ffcac54', true),
  ('13375757-eee0-4e53-9246-2bc83ffcac54', 'deadbeef-577b-4b39-b68d-4b1bc89e4a2f', true)
);

-- creating some game invites
insert into public."game-invites" (initiator_id, opponent_id, rows, cols, layers, start_fences, gid)
(values
  ('13375757-eee0-4e53-9246-2bc83ffcac54', 'deadbeef-577b-4b39-b68d-4b1bc89e4a2f', 9, 9, 3, 15, null),

  ('abcdbbfc-577b-4b39-b68d-4b1bc89e4a2f', '13375757-eee0-4e53-9246-2bc83ffcac54', 6, 6, 2, 12, '80085757-eee0-4e53-9246-2bc83ffcac54')
);