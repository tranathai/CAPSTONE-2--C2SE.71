-- Chạy trên máy ĐANG CHẠY MySQL (phpMyAdmin → SQL hoặc mysql.exe).
-- Đổi YOUR_PASSWORD và tên database cho đúng project.

CREATE DATABASE IF NOT EXISTS `mentorai_grad`
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- User riêng cho máy khác trong LAN (không nên dùng root từ xa)
CREATE USER IF NOT EXISTS 'mentor_shared'@'%' IDENTIFIED BY 'YOUR_PASSWORD';

GRANT ALL PRIVILEGES ON mentorai_grad.* TO 'mentor_shared'@'%';

FLUSH PRIVILEGES;
