-- RPC function to create a user profile with elevated permissions
CREATE OR REPLACE FUNCTION create_profile(user_id UUID, user_name TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert the profile with security definer permissions (bypassing RLS)
  INSERT INTO profiles (id, full_name)
  VALUES (user_id, user_name)
  ON CONFLICT (id) DO UPDATE
  SET full_name = user_name;
END;
$$; 