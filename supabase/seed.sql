-- =============================================
-- 신데렐라 (Cinderella) — 데모 시드 데이터
-- VC 미팅용 샘플 명품 렌탈 아이템 3개
-- 실행 방법: Supabase 대시보드 → SQL Editor → 아래 전체 붙여넣기 후 Run
-- =============================================

-- STEP 1: 데모 유저 생성 (auth.users에 없어도 items 표시용으로만 사용)
-- 주의: 실제 auth.users에 해당 UUID가 없으면 FK 오류 발생.
-- Supabase SQL Editor에서 실행 시 아래 방법으로 우회:

-- 1-A. auth.users에 데모 유저 직접 삽입 (service_role 권한 필요)
INSERT INTO auth.users (
  id,
  email,
  created_at,
  updated_at,
  raw_user_meta_data,
  role,
  aud
)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'demo@cinderella-app.com',
  NOW(),
  NOW(),
  '{"full_name": "신데렐라 데모", "avatar_url": "https://ui-avatars.com/api/?name=Demo&background=1a1a2e&color=fff"}',
  'authenticated',
  'authenticated'
)
ON CONFLICT (id) DO NOTHING;

-- 1-B. public.users에 데모 유저 등록
INSERT INTO public.users (id, email, name, avatar_url)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'demo@cinderella-app.com',
  '신데렐라 데모',
  'https://ui-avatars.com/api/?name=Demo&background=1a1a2e&color=fff'
)
ON CONFLICT (id) DO NOTHING;

-- STEP 2: 명품 아이템 3개 삽입
INSERT INTO public.items (id, user_id, title, brand, category, price_per_day, description, images, status)
VALUES
  (
    'aaaaaaaa-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'Chanel Classic Flap 미디엄 블랙 캐비어',
    'Chanel',
    'bags',
    25000,
    '샤넬 클래식 플랩 미디엄 사이즈. 블랙 캐비어 가죽, 실버 메탈. 2024년 구매, 상태 S급. 정품 영수증·박스 보관 중. 하루 25,000원, 3일 이상 시 협의 가능.',
    ARRAY['https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&q=80', 'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=800&q=80'],
    'available'
  ),
  (
    'bbbbbbbb-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'Hermès Birkin 30 에투프 토고',
    'Hermès',
    'bags',
    80000,
    '에르메스 버킨 30, 에투프 컬러, 토고 가죽, 골드 하드웨어. 2023년 파리 부티크 구매. 먼지 커버·자물쇠·열쇠 포함. 상태 A+. 특별한 날 완벽한 동반자.',
    ARRAY['https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&q=80', 'https://images.unsplash.com/photo-1591561954557-26941169b49e?w=800&q=80'],
    'available'
  ),
  (
    'cccccccc-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000001',
    'Louis Vuitton Neverfull MM 다미에 에벤',
    'Louis Vuitton',
    'bags',
    15000,
    '루이비통 네버풀 MM, 다미에 에벤 패턴, 베이지 인테리어. 일상 사용 가능한 실용적 디자인. 2022년 구매, 상태 A급. 파우치 포함.',
    ARRAY['https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&q=80'],
    'available'
  )
ON CONFLICT (id) DO NOTHING;

-- 확인 쿼리 (실행 후 결과 확인용)
-- SELECT i.title, i.brand, i.price_per_day, i.status FROM public.items i ORDER BY i.created_at;
