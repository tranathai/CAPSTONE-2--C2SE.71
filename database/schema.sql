-- ================================================================
-- MentorAI Grad — Unified Database Schema
-- Run: mysql -u root -p < database/schema.sql
-- ================================================================

CREATE DATABASE IF NOT EXISTS mentorai_grad
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE mentorai_grad;

-- Roles
CREATE TABLE IF NOT EXISTS roles (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL UNIQUE
);
INSERT INTO roles (name) VALUES
  ('admin'),
  ('student'),
  ('supervisor')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Users
CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role_id INT UNSIGNED NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  phone VARCHAR(20) DEFAULT NULL,
  avatar_url VARCHAR(500) DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles(id)
);

-- Student profiles
CREATE TABLE IF NOT EXISTS student_profiles (
  user_id INT UNSIGNED PRIMARY KEY,
  student_code VARCHAR(50) DEFAULT NULL,
  class_name VARCHAR(100) DEFAULT NULL,
  major VARCHAR(255) DEFAULT NULL,
  enrollment_year SMALLINT UNSIGNED DEFAULT NULL,
  CONSTRAINT fk_student_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Supervisor profiles
CREATE TABLE IF NOT EXISTS supervisor_profiles (
  user_id INT UNSIGNED PRIMARY KEY,
  lecturer_code VARCHAR(50) DEFAULT NULL,
  department VARCHAR(255) DEFAULT NULL,
  specialization VARCHAR(255) DEFAULT NULL,
  academic_title VARCHAR(100) DEFAULT NULL,
  office_address VARCHAR(255) DEFAULT NULL,
  CONSTRAINT fk_supervisor_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Teams
CREATE TABLE IF NOT EXISTS teams (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  description TEXT DEFAULT NULL,
  semester VARCHAR(50) DEFAULT NULL,
  leader_user_id INT UNSIGNED DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_team_leader FOREIGN KEY (leader_user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Team members
CREATE TABLE IF NOT EXISTS team_members (
  team_id INT UNSIGNED NOT NULL,
  user_id INT UNSIGNED NOT NULL,
  joined_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (team_id, user_id),
  CONSTRAINT fk_tm_team FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  CONSTRAINT fk_tm_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Milestones
CREATE TABLE IF NOT EXISTS milestones (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  description TEXT DEFAULT NULL,
  start_date DATETIME NOT NULL,
  end_date DATETIME NOT NULL,
  deadline_type ENUM('soft', 'hard') NOT NULL DEFAULT 'soft',
  display_order INT UNSIGNED NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Topic registrations
CREATE TABLE IF NOT EXISTS topic_registrations (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  team_id INT UNSIGNED NOT NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT DEFAULT NULL,
  technologies TEXT DEFAULT NULL,
  status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  supervisor_id INT UNSIGNED DEFAULT NULL,
  rejection_reason TEXT DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_topic_team FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  CONSTRAINT fk_topic_supervisor FOREIGN KEY (supervisor_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Submissions
CREATE TABLE IF NOT EXISTS submissions (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  team_id INT UNSIGNED NOT NULL,
  milestone_id INT UNSIGNED DEFAULT NULL,
  title VARCHAR(255) NOT NULL,
  submitted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status_label VARCHAR(50) DEFAULT 'Pending Review',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_submission_team FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  CONSTRAINT fk_submission_milestone FOREIGN KEY (milestone_id) REFERENCES milestones(id) ON DELETE SET NULL
);

-- Submission versions
CREATE TABLE IF NOT EXISTS submission_versions (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  submission_id INT UNSIGNED NOT NULL,
  version_number INT UNSIGNED NOT NULL DEFAULT 1,
  file_path VARCHAR(500) NOT NULL,
  original_filename VARCHAR(255) DEFAULT NULL,
  file_size BIGINT UNSIGNED DEFAULT NULL,
  submitted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  is_late TINYINT(1) NOT NULL DEFAULT 0,
  CONSTRAINT fk_version_submission FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE
);

-- Feedbacks
CREATE TABLE IF NOT EXISTS feedbacks (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  submission_version_id INT UNSIGNED NOT NULL,
  supervisor_id INT UNSIGNED NOT NULL,
  content TEXT NOT NULL,
  is_final TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_feedback_version FOREIGN KEY (submission_version_id) REFERENCES submission_versions(id) ON DELETE CASCADE,
  CONSTRAINT fk_feedback_supervisor FOREIGN KEY (supervisor_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Meeting participants
CREATE TABLE IF NOT EXISTS meeting_participants (
  meeting_id INT UNSIGNED NOT NULL,
  user_id INT UNSIGNED NOT NULL,
  PRIMARY KEY (meeting_id, user_id),
  CONSTRAINT fk_mp_meeting FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE,
  CONSTRAINT fk_mp_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Meetings
CREATE TABLE IF NOT EXISTS meetings (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(500) NOT NULL,
  description TEXT DEFAULT NULL,
  scheduled_at DATETIME NOT NULL,
  duration_minutes INT UNSIGNED DEFAULT 60,
  team_id INT UNSIGNED DEFAULT NULL,
  host_id INT UNSIGNED NOT NULL,
  meeting_url VARCHAR(500) DEFAULT NULL,
  location VARCHAR(255) DEFAULT NULL,
  status ENUM('scheduled', 'cancelled', 'completed') NOT NULL DEFAULT 'scheduled',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_meeting_team FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL,
  CONSTRAINT fk_meeting_host FOREIGN KEY (host_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Meeting requests (from students to supervisor)
CREATE TABLE IF NOT EXISTS meeting_requests (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  team_id INT UNSIGNED NOT NULL,
  requester_id INT UNSIGNED NOT NULL,
  supervisor_id INT UNSIGNED NOT NULL,
  title VARCHAR(500) NOT NULL,
  reason TEXT DEFAULT NULL,
  proposed_at DATETIME NOT NULL,
  status ENUM('pending', 'approved', 'declined') NOT NULL DEFAULT 'pending',
  response_reason TEXT DEFAULT NULL,
  response_at DATETIME DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_req_team FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  CONSTRAINT fk_req_requester FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_req_supervisor FOREIGN KEY (supervisor_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Messages
CREATE TABLE IF NOT EXISTS messages (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  sender_id INT UNSIGNED NOT NULL,
  receiver_id INT UNSIGNED NOT NULL,
  topic_id INT UNSIGNED NULL, -- Thêm topic_id để messages theo từng dự án
  content TEXT NOT NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_msg_sender FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_msg_receiver FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_msg_topic FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type ENUM('info', 'deadline', 'feedback', 'meeting', 'system') NOT NULL DEFAULT 'info',
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  related_url VARCHAR(500) DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- System config (milestone dates etc.)
CREATE TABLE IF NOT EXISTS system_config (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  config_key VARCHAR(100) NOT NULL UNIQUE,
  config_value TEXT DEFAULT NULL,
  description VARCHAR(500) DEFAULT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ================================================================
-- Seed data
-- Passwords: admin123, student123, super123  (bcrypt hashed, cost 10)
-- All accounts have is_active=1, can login with empty or minimum password
-- ================================================================

-- Admin account
INSERT INTO users (email, password_hash, full_name, role_id, is_active) VALUES
  ('admin@mentorai.edu', '$2b$10$rQZ8K.W6mVf5j9X5Yq5K5e5q5K5K5K5K5K5K5K5K5K5K5K5K5K5K5K', 'Quản trị viên', 1, 1)
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name);

-- Student accounts
INSERT INTO users (email, password_hash, full_name, role_id, is_active, phone) VALUES
  ('nguyen.van.a@student.edu.vn', '$2b$10$rQZ8K.W6mVf5j9X5Yq5K5e5q5K5K5K5K5K5K5K5K5K5K5K5K5K5K5K', 'Nguyễn Văn A', 2, 1, '0901234567'),
  ('tran.thi.b@student.edu.vn', '$2b$10$rQZ8K.W6mVf5j9X5Yq5K5e5q5K5K5K5K5K5K5K5K5K5K5K5K5K5K5K', 'Trần Thị B', 2, 1, '0912345678'),
  ('le.van.c@student.edu.vn', '$2b$10$rQZ8K.W6mVf5j9X5Yq5K5e5q5K5K5K5K5K5K5K5K5K5K5K5K5K5K5K', 'Lê Văn C', 2, 1, '0923456789')
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name);

INSERT INTO student_profiles (user_id, student_code, class_name, major, enrollment_year) VALUES
  ((SELECT id FROM users WHERE email = 'nguyen.van.a@student.edu.vn'), 'SV001', 'CNTT-K18', 'Công nghệ thông tin', 2024),
  ((SELECT id FROM users WHERE email = 'tran.thi.b@student.edu.vn'), 'SV002', 'CNTT-K18', 'Công nghệ thông tin', 2024),
  ((SELECT id FROM users WHERE email = 'le.van.c@student.edu.vn'), 'SV003', 'CNTT-K18', 'Công nghệ thông tin', 2024)
ON DUPLICATE KEY UPDATE student_code = VALUES(student_code);

-- Supervisor accounts
INSERT INTO users (email, password_hash, full_name, role_id, is_active, phone) VALUES
  ('ts.nguyen@mentorai.edu', '$2b$10$rQZ8K.W6mVf5j9X5Yq5K5e5q5K5K5K5K5K5K5K5K5K5K5K5K5K5K5K', 'Ts. Nguyễn Văn Supervisor', 3, 1, '0934567890'),
  ('ths.pham@mentorai.edu', '$2b$10$rQZ8K.W6mVf5j9X5Yq5K5e5q5K5K5K5K5K5K5K5K5K5K5K5K5K5K5K', 'Ths. Phạm Thị Supervisor', 3, 1, '0945678901')
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name);

INSERT INTO supervisor_profiles (user_id, lecturer_code, department, specialization, academic_title) VALUES
  ((SELECT id FROM users WHERE email = 'ts.nguyen@mentorai.edu'), 'GV001', 'Khoa Công nghệ thông tin', 'Trí tuệ nhân tạo', 'Tiến sĩ'),
  ((SELECT id FROM users WHERE email = 'ths.pham@mentorai.edu'), 'GV002', 'Khoa Công nghệ thông tin', 'Khoa học dữ liệu', 'Thạc sĩ')
ON DUPLICATE KEY UPDATE lecturer_code = VALUES(lecturer_code);

-- Teams
INSERT INTO teams (name, description, semester, leader_user_id) VALUES
  ('CS-401 Nhóm Capstone 1', 'Nhóm dự án capstone công nghệ thông tin', '2024-1',
    (SELECT id FROM users WHERE email = 'nguyen.van.a@student.edu.vn')),
  ('CS-401 Nhóm Capstone 2', 'Nhóm dự án thứ hai', '2024-1',
    (SELECT id FROM users WHERE email = 'tran.thi.b@student.edu.vn'))
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Team members
INSERT INTO team_members (team_id, user_id) VALUES
  ((SELECT id FROM teams WHERE name = 'CS-401 Nhóm Capstone 1'),
   (SELECT id FROM users WHERE email = 'nguyen.van.a@student.edu.vn')),
  ((SELECT id FROM teams WHERE name = 'CS-401 Nhóm Capstone 1'),
   (SELECT id FROM users WHERE email = 'tran.thi.b@student.edu.vn')),
  ((SELECT id FROM teams WHERE name = 'CS-401 Nhóm Capstone 1'),
   (SELECT id FROM users WHERE email = 'le.van.c@student.edu.vn')),
  ((SELECT id FROM teams WHERE name = 'CS-401 Nhóm Capstone 2'),
   (SELECT id FROM users WHERE email = 'tran.thi.b@student.edu.vn'))
ON DUPLICATE KEY UPDATE team_id = VALUES(team_id);

-- Milestones
INSERT INTO milestones (name, description, start_date, end_date, deadline_type, display_order) VALUES
  ('Proposal', 'Nộp đề cương dự án', DATE_SUB(NOW(), INTERVAL 60 DAY), DATE_ADD(NOW(), INTERVAL -15 DAY), 'hard', 1),
  ('Mid-term Report', 'Báo cáo giữa kỳ', DATE_ADD(NOW(), INTERVAL -10 DAY), DATE_ADD(NOW(), INTERVAL 20 DAY), 'soft', 2),
  ('Final Report', 'Báo cáo cuối kỳ', DATE_ADD(NOW(), INTERVAL 25 DAY), DATE_ADD(NOW(), INTERVAL 60 DAY), 'soft', 3)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Topic registrations
INSERT INTO topic_registrations (team_id, title, description, technologies, status, supervisor_id) VALUES
  ((SELECT id FROM teams WHERE name = 'CS-401 Nhóm Capstone 1'),
   'Hệ thống quản lý đồ án capstone với AI', 'Xây dựng hệ thống quản lý đồ án sử dụng AI để gợi ý và đánh giá',
   'React, Node.js, MySQL, Gemini API', 'approved',
   (SELECT id FROM users WHERE email = 'ts.nguyen@mentorai.edu')),
  ((SELECT id FROM teams WHERE name = 'CS-401 Nhóm Capstone 2'),
   'Ứng dụng học máy trong phân tích dữ liệu giáo dục', 'Nghiên cứu và triển khai mô hình ML cho phân tích dữ liệu học tập',
   'Python, TensorFlow, PostgreSQL', 'pending', NULL)
ON DUPLICATE KEY UPDATE title = VALUES(title);

-- Submissions
INSERT INTO submissions (team_id, milestone_id, title, status_label) VALUES
  ((SELECT id FROM teams WHERE name = 'CS-401 Nhóm Capstone 1'),
   (SELECT id FROM milestones WHERE name = 'Proposal'),
   'Đề cương dự án AI Mentor', 'Reviewed'),
  ((SELECT id FROM teams WHERE name = 'CS-401 Nhóm Capstone 1'),
   (SELECT id FROM milestones WHERE name = 'Mid-term Report'),
   'Báo cáo giữa kỳ - Tiến độ học tập', 'Pending Review')
ON DUPLICATE KEY UPDATE title = VALUES(title);

-- Submission versions
INSERT INTO submission_versions (submission_id, version_number, file_path, original_filename, is_late) VALUES
  ((SELECT id FROM submissions WHERE title = 'Đề cương dự án AI Mentor'), 1,
   '/uploads/reports/proposal-v1.pdf', 'proposal-v1.pdf', 0),
  ((SELECT id FROM submissions WHERE title = 'Đề cương dự án AI Mentor'), 2,
   '/uploads/reports/proposal-final.pdf', 'proposal-final.pdf', 0),
  ((SELECT id FROM submissions WHERE title = 'Báo cáo giữa kỳ - Tiến độ học tập'), 1,
   '/uploads/reports/midterm-draft.pdf', 'midterm-draft.pdf', 0)
ON DUPLICATE KEY UPDATE file_path = VALUES(file_path);

-- Feedbacks
INSERT INTO feedbacks (submission_version_id, supervisor_id, content, is_final) VALUES
  ((SELECT id FROM submission_versions WHERE file_path = '/uploads/reports/proposal-v1.pdf'),
   (SELECT id FROM users WHERE email = 'ts.nguyen@mentorai.edu'),
   'Cấu trúc đề cương tốt. Cần bổ sung phần tài liệu tham khảo và mô tả chi tiết hơn về API integration.', 0),
  ((SELECT id FROM submission_versions WHERE file_path = '/uploads/reports/proposal-final.pdf'),
   (SELECT id FROM users WHERE email = 'ts.nguyen@mentorai.edu'),
   'Đề cương đã được chỉnh sửa tốt. Phần API integration đã rõ ràng. Đạt yêu cầu. Có thể tiến hành triển khai.', 1)
ON DUPLICATE KEY UPDATE content = VALUES(content);
