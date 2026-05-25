-- 건물 관리비 체크 · Supabase 초기 스키마 (PRD 기준 + phone)

CREATE TABLE households (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_no VARCHAR NOT NULL UNIQUE,
  password VARCHAR NOT NULL DEFAULT '1234',
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  phone VARCHAR NOT NULL DEFAULT ''
);

CREATE TABLE payments (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  room_no VARCHAR NOT NULL REFERENCES households (room_no) ON UPDATE CASCADE,
  payment_month VARCHAR(7) NOT NULL,
  paid_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status VARCHAR NOT NULL DEFAULT '확인대기' CHECK (status IN ('확인대기', '입금완료')),
  UNIQUE (room_no, payment_month)
);

CREATE TABLE expenses (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  expense_month VARCHAR(7) NOT NULL,
  category VARCHAR NOT NULL,
  amount INT NOT NULL CHECK (amount >= 0),
  memo TEXT,
  UNIQUE (expense_month, category)
);

CREATE INDEX idx_payments_month ON payments (payment_month);
CREATE INDEX idx_payments_room ON payments (room_no);
CREATE INDEX idx_expenses_month ON expenses (expense_month);

-- 9세대 시드
INSERT INTO households (room_no, password, is_admin, phone) VALUES
  ('B01', '1234', false, ''),
  ('B02', '1234', false, ''),
  ('101', '1234', false, ''),
  ('102', '1234', false, ''),
  ('201', '1234', false, ''),
  ('202', '1234', false, ''),
  ('301', '1234', false, ''),
  ('302', '1234', false, ''),
  ('401', '1234', true, '01012345678');
