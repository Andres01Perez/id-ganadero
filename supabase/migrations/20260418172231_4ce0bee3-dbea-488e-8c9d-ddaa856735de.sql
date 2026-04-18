INSERT INTO public.user_roles (user_id, role)
VALUES ('a3f8485d-8604-4194-bbf8-a1e623e4f124', 'super_admin')
ON CONFLICT (user_id, role) DO NOTHING;