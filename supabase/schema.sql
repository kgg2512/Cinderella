-- =============================================
-- 신데렐라 (Cinderella) — Supabase Schema
-- P2P 명품 공유 커뮤니티 플랫폼
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- USERS
-- =============================================
CREATE TABLE IF NOT EXISTS public.users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL UNIQUE,
  name        TEXT,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 본인만 자신의 프로필 수정 가능
CREATE POLICY "Users can view all profiles" ON public.users
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- =============================================
-- ITEMS (물품)
-- =============================================
CREATE TYPE item_status AS ENUM ('available', 'rented', 'hidden');
CREATE TYPE item_category AS ENUM ('bags', 'clothing', 'shoes', 'accessories', 'jewelry', 'watches', 'other');

CREATE TABLE IF NOT EXISTS public.items (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title          TEXT NOT NULL,
  brand          TEXT,
  category       item_category NOT NULL DEFAULT 'other',
  price_per_day  INTEGER NOT NULL CHECK (price_per_day >= 0),
  description    TEXT,
  images         TEXT[] NOT NULL DEFAULT '{}',
  status         item_status NOT NULL DEFAULT 'available',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS items_user_id_idx ON public.items(user_id);
CREATE INDEX IF NOT EXISTS items_category_idx ON public.items(category);
CREATE INDEX IF NOT EXISTS items_status_idx ON public.items(status);
CREATE INDEX IF NOT EXISTS items_created_at_idx ON public.items(created_at DESC);

ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;

-- available 물품은 모두 조회 가능
CREATE POLICY "Anyone can view available items" ON public.items
  FOR SELECT USING (status = 'available' OR auth.uid() = user_id);

CREATE POLICY "Users can insert own items" ON public.items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own items" ON public.items
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own items" ON public.items
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- RENTAL REQUESTS (렌탈 요청)
-- =============================================
CREATE TYPE request_status AS ENUM ('pending', 'accepted', 'rejected', 'completed', 'cancelled');

CREATE TABLE IF NOT EXISTS public.rental_requests (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id       UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  requester_id  UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  owner_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  start_date    DATE NOT NULL,
  end_date      DATE NOT NULL,
  status        request_status NOT NULL DEFAULT 'pending',
  message       TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS rental_requests_item_id_idx ON public.rental_requests(item_id);
CREATE INDEX IF NOT EXISTS rental_requests_requester_id_idx ON public.rental_requests(requester_id);
CREATE INDEX IF NOT EXISTS rental_requests_owner_id_idx ON public.rental_requests(owner_id);

ALTER TABLE public.rental_requests ENABLE ROW LEVEL SECURITY;

-- 요청자 또는 소유자만 조회 가능
CREATE POLICY "Requester and owner can view requests" ON public.rental_requests
  FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = owner_id);

CREATE POLICY "Authenticated users can create requests" ON public.rental_requests
  FOR INSERT WITH CHECK (auth.uid() = requester_id);

-- 소유자는 상태 변경 가능, 요청자는 취소 가능
CREATE POLICY "Owner can update request status" ON public.rental_requests
  FOR UPDATE USING (auth.uid() = owner_id OR auth.uid() = requester_id);

-- =============================================
-- WISHLIST (찜 목록)
-- =============================================
CREATE TABLE IF NOT EXISTS public.wishlist (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  item_id     UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, item_id)
);

CREATE INDEX IF NOT EXISTS wishlist_user_id_idx ON public.wishlist(user_id);

ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wishlist" ON public.wishlist
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can add to wishlist" ON public.wishlist
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove from wishlist" ON public.wishlist
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- FUNCTION: 신규 사용자 자동 등록
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: auth.users 신규 생성 시 public.users 자동 등록
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- STORAGE: 물품 이미지 버킷
-- =============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('item-images', 'item-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view item images" ON storage.objects
  FOR SELECT USING (bucket_id = 'item-images');

CREATE POLICY "Authenticated users can upload item images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'item-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete own item images" ON storage.objects
  FOR DELETE USING (bucket_id = 'item-images' AND auth.uid()::text = (storage.foldername(name))[1]);
