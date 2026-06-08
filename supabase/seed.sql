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

-- STEP 2: 명품 아이템 8개 삽입 (bags 3 + watches 2 + jewelry 1 + shoes 1 + clothing 1)
INSERT INTO public.items (id, user_id, title, brand, category, price_per_day, description, images, status)
VALUES
  -- ── BAGS ──
  (
    'aaaaaaaa-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'Chanel Classic Flap 미디엄 블랙 캐비어',
    'Chanel',
    'bags',
    25000,
    '샤넬 클래식 플랩 미디엄. 블랙 캐비어 가죽, 실버 메탈. 2024년 구매, 상태 S급. 정품 영수증·박스 포함.',
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
    '에르메스 버킨 30, 에투프 컬러, 토고 가죽, 골드 하드웨어. 2023년 파리 부티크 구매. 먼지 커버·자물쇠·열쇠 포함. 상태 A+.',
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
    '루이비통 네버풀 MM, 다미에 에벤 패턴. 2022년 구매, 상태 A급. 파우치 포함. 일상·여행 모두 가능.',
    ARRAY['https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&q=80'],
    'available'
  ),
  -- ── WATCHES ──
  (
    'dddddddd-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000001',
    'Rolex Datejust 36 화이트 다이얼',
    'Rolex',
    'watches',
    50000,
    '롤렉스 데이저스트 36mm, 화이트 다이얼, 오이스터 브레이슬릿. 2021년 구매, 서비스 완료. 상자·보증서 포함. 비즈니스·포멀 행사 추천.',
    ARRAY['https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=800&q=80', 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=800&q=80'],
    'available'
  ),
  (
    'eeeeeeee-0000-0000-0000-000000000005',
    '00000000-0000-0000-0000-000000000001',
    'Cartier Santos 미디움 스틸',
    'Cartier',
    'watches',
    35000,
    '까르띠에 산토스 미디움, 스틸·옐로우 골드 투톤. 스퀘어 케이스, 블루 스틸 핸즈. 2022년 구매. 박스·보증서·여분 스트랩 포함.',
    ARRAY['https://images.unsplash.com/photo-1434056886845-dac89ffe9b56?w=800&q=80'],
    'available'
  ),
  -- ── JEWELRY ──
  (
    'ffffffff-0000-0000-0000-000000000006',
    '00000000-0000-0000-0000-000000000001',
    'Tiffany & Co. T Wire 브레이슬릿 18K',
    'Tiffany & Co.',
    'jewelry',
    12000,
    '티파니 T 와이어 브레이슬릿, 18K 로즈 골드. 2023년 구매, 상태 S급. 정품 박스·파우치 포함. 미니멀 데일리룩부터 포멀까지.',
    ARRAY['https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&q=80'],
    'available'
  ),
  -- ── SHOES ──
  (
    'gggggggg-0000-0000-0000-000000000007',
    '00000000-0000-0000-0000-000000000001',
    'Christian Louboutin 소 케이트 100 누드',
    'Christian Louboutin',
    'shoes',
    20000,
    '크리스찬 루부탱 소 케이트 100mm, 누드 스웨이드. 사이즈 37(KR 240). 상태 A급. 더스트백 포함. 결혼식·파티·포토룩 최적.',
    ARRAY['https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&q=80'],
    'available'
  ),
  -- ── CLOTHING ──
  (
    'hhhhhhhh-0000-0000-0000-000000000008',
    '00000000-0000-0000-0000-000000000001',
    'Valentino 가라바니 로마 스터드 재킷',
    'Valentino',
    'clothing',
    40000,
    '발렌티노 로마 스터드 블레이저, 블랙. 사이즈 IT 40(KR M). 2023 S/S. 상태 S급. 더스트백·행거 포함. 포멀·세미포멀 완벽.',
    ARRAY['https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&q=80'],
    'available'
  )
ON CONFLICT (id) DO NOTHING;

-- 확인 쿼리 (실행 후 결과 확인용)
-- SELECT i.title, i.brand, i.category, i.price_per_day, i.status FROM public.items i ORDER BY i.category, i.price_per_day;
