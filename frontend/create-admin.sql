-- Chạy lệnh này trong Supabase SQL Editor sau khi đăng ký tài khoản admin@demo.com

-- Nâng cấp user lên admin
UPDATE user_profiles
SET
  role = 'admin',
  daily_search_limit = 999999,
  is_active = true
WHERE email = 'admin@demo.com';

-- Kiểm tra kết quả
SELECT email, full_name, role, daily_search_limit, is_active
FROM user_profiles
WHERE email = 'admin@demo.com';
