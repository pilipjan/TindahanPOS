-- ════════════════════════════════════════════
-- 002: Auto-create Store & Profile on Sign Up
-- ════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_store_id UUID;
BEGIN
  -- 1. Create a default "My Store" for the new user
  INSERT INTO public.stores (store_name, store_address, tin, vat_registered)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'My') || '''s Store',
    'Edit in Settings',
    '000-000-000-000',
    true
  )
  RETURNING id INTO v_store_id;

  -- 2. Create the associated profile with 'owner' role
  INSERT INTO public.profiles (id, store_id, full_name, email, role)
  VALUES (
    NEW.id,
    v_store_id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New Owner'),
    NEW.email,
    'owner'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger on Supabase's auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
