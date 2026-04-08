-- ════════════════════════════════════════════
-- 002: Auto-create Store & Profile on Sign Up
-- Supports both Owner (creates new store) and
-- Staff (joins existing store via invite token)
-- ════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_store_id    UUID;
  v_invite_role TEXT;
  v_invite_token TEXT;
BEGIN
  -- Check if user signed up via an invite link
  v_invite_token := NEW.raw_user_meta_data->>'invite_token';

  IF v_invite_token IS NOT NULL THEN
    -- Look up the invite and extract the store_id + role
    SELECT store_id, role
      INTO v_store_id, v_invite_role
      FROM public.store_invites
     WHERE token = v_invite_token
       AND used_by IS NULL
       AND expires_at > NOW();

    IF v_store_id IS NOT NULL THEN
      -- Create the profile linked to the existing store
      INSERT INTO public.profiles (id, store_id, full_name, email, role)
      VALUES (
        NEW.id,
        v_store_id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'New Staff'),
        NEW.email,
        COALESCE(v_invite_role, 'cashier')
      );

      -- Mark the invite as used
      UPDATE public.store_invites
         SET used_by = NEW.id, used_at = NOW()
       WHERE token = v_invite_token;

      RETURN NEW;
    END IF;
  END IF;

  -- No valid invite: create a brand-new store for this owner
  INSERT INTO public.stores (store_name, store_address, tin, vat_registered)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'My') || '''s Store',
    'Edit in Settings',
    '000-000-000-000',
    true
  )
  RETURNING id INTO v_store_id;

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
