-- Profiles table
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  avatar_url text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Marketplace products table
CREATE TABLE public.marketplace_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  price numeric(10,2) NOT NULL DEFAULT 0,
  category text NOT NULL DEFAULT 'other',
  condition text NOT NULL DEFAULT 'used',
  image_url text,
  location text,
  is_sold boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.marketplace_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view products" ON public.marketplace_products FOR SELECT USING (true);
CREATE POLICY "Auth users can create products" ON public.marketplace_products FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner can update products" ON public.marketplace_products FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Owner can delete products" ON public.marketplace_products FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Storage bucket for marketplace images
INSERT INTO storage.buckets (id, name, public) VALUES ('marketplace-images', 'marketplace-images', true);

CREATE POLICY "Anyone can view marketplace images" ON storage.objects FOR SELECT USING (bucket_id = 'marketplace-images');
CREATE POLICY "Auth users can upload marketplace images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'marketplace-images');
CREATE POLICY "Users can delete own images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'marketplace-images');