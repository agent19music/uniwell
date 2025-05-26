-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Therapist profiles are publicly readable" ON "public"."therapist_profiles";
DROP POLICY IF EXISTS "Therapists can update own profile" ON "public"."therapist_profiles";
DROP POLICY IF EXISTS "Therapists can insert own profile" ON "public"."therapist_profiles";

-- Add missing columns to therapist_profiles if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'therapist_profiles'
                  AND column_name = 'created_at') THEN
        ALTER TABLE public.therapist_profiles ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT now();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'therapist_profiles'
                  AND column_name = 'updated_at') THEN
        ALTER TABLE public.therapist_profiles ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'therapist_profiles'
                  AND column_name = 'license_number') THEN
        ALTER TABLE public.therapist_profiles ADD COLUMN license_number TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'therapist_profiles'
                  AND column_name = 'experience_years') THEN
        ALTER TABLE public.therapist_profiles ADD COLUMN experience_years INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'therapist_profiles'
                  AND column_name = 'languages') THEN
        ALTER TABLE public.therapist_profiles ADD COLUMN languages TEXT[];
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'therapist_profiles'
                  AND column_name = 'profile_picture') THEN
        ALTER TABLE public.therapist_profiles ADD COLUMN profile_picture TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'therapist_profiles'
                  AND column_name = 'education') THEN
        ALTER TABLE public.therapist_profiles ADD COLUMN education TEXT[];
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'therapist_profiles'
                  AND column_name = 'profile_completed') THEN
        ALTER TABLE public.therapist_profiles ADD COLUMN profile_completed BOOLEAN DEFAULT false;
    END IF;
END
$$;

-- Create RLS policies for therapist_profiles
CREATE POLICY "Therapist profiles are publicly readable"
ON "public"."therapist_profiles"
AS PERMISSIVE
FOR SELECT
TO public
USING (true);

CREATE POLICY "Therapists can update own profile"
ON "public"."therapist_profiles"
AS PERMISSIVE
FOR UPDATE
TO public
USING (auth.uid() = id);

CREATE POLICY "Therapists can insert own profile"
ON "public"."therapist_profiles"
AS PERMISSIVE
FOR INSERT
TO public
WITH CHECK (auth.uid() = id);

-- Add policy for appointments
DROP POLICY IF EXISTS "Clients can book appointments" ON "public"."appointments";
CREATE POLICY "Clients can book appointments"
ON "public"."appointments"
AS PERMISSIVE
FOR INSERT
TO public
WITH CHECK (auth.uid() = client_id);

-- Trigger to update updated_at column on therapist_profiles
CREATE OR REPLACE FUNCTION public.update_therapist_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_therapist_profiles_updated_at_trigger') THEN
        CREATE TRIGGER update_therapist_profiles_updated_at_trigger
        BEFORE UPDATE ON public.therapist_profiles
        FOR EACH ROW
        EXECUTE FUNCTION public.update_therapist_profiles_updated_at();
    END IF;
END
$$; 