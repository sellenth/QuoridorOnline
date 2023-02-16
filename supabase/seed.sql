WITH credentials(mail, pass, extra_data) AS (
  -- PUT YOUR EMAILS AND PASSWORDS HERE.
  SELECT * FROM (VALUES ('halston@sellent.in', 'password', '{ "preferred_username": "gamer" }'::jsonb)) AS users
),
create_user AS (
  INSERT INTO auth.users (id, instance_id, ROLE, aud, email, raw_app_meta_data, raw_user_meta_data, is_super_admin, encrypted_password, created_at, updated_at, last_sign_in_at, email_confirmed_at, confirmation_sent_at, confirmation_token, recovery_token, email_change_token_new, email_change)
    SELECT '13375757-eee0-4e53-9246-2bc83ffcac54', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', mail, '{"provider":"email","providers":["email"]}', extra_data, FALSE, crypt(pass, gen_salt('bf')), NOW(), NOW(), NOW(), NOW(), NOW(), '', '', '', '' FROM credentials
  RETURNING id
)
INSERT INTO auth.identities (id, provider, user_id, identity_data, last_sign_in_at, created_at, updated_at)
  SELECT id, 'email', id, json_build_object('sub', id), NOW(), NOW(), NOW() FROM create_user;

insert into public."games" (id, move_num, p1_id, p2_id, moves)
values
  ('80085757-eee0-4e53-9246-2bc83ffcac54', 5,'abcdbbfc-577b-4b39-b68d-4b1bc89e4a2f', '13375757-eee0-4e53-9246-2bc83ffcac54', '{{1,4,0,4},{2,6,0,0},{3,6,2,4},{0,15,9,3},{0,3,9,3}}');