CREATE DATABASE IF NOT EXISTS mentorai_grad
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE mentorai_grad;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role ENUM('student', 'teacher') NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_users_email (email),
  KEY idx_users_role (role)
);

CREATE TABLE IF NOT EXISTS students (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  student_code VARCHAR(50) NULL,
  major VARCHAR(255) NULL,
  class_name VARCHAR(100) NULL,
  enrollment_year SMALLINT UNSIGNED NULL,
  phone VARCHAR(20) NULL,
  date_of_birth DATE NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_students_user_id (user_id),
  UNIQUE KEY uk_students_student_code (student_code),
  CONSTRAINT fk_students_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS lecturers (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  lecturer_code VARCHAR(50) NULL,
  department VARCHAR(255) NULL,
  specialization VARCHAR(255) NULL,
  academic_title VARCHAR(100) NULL,
  phone VARCHAR(20) NULL,
  office_address VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_lecturers_user_id (user_id),
  UNIQUE KEY uk_lecturers_lecturer_code (lecturer_code),
  CONSTRAINT fk_lecturers_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

INSERT INTO users (email, password_hash, full_name, role)
SELECT 'student.demo@gmail.com', '$2b$10$replace_me_with_bcrypt_hash', 'Sinh vien demo', 'student'
WHERE NOT EXISTS (
  SELECT 1 FROM users WHERE email = 'student.demo@gmail.com'
);

INSERT INTO users (email, password_hash, full_name, role)
SELECT 'lecturer.demo@gmail.com', '$2b$10$replace_me_with_bcrypt_hash', 'Giang vien demo', 'teacher'
WHERE NOT EXISTS (
  SELECT 1 FROM users WHERE email = 'lecturer.demo@gmail.com'
);

INSERT INTO students (user_id, student_code, major, class_name, enrollment_year, phone)
SELECT u.id, 'SV001', 'Cong nghe thong tin', 'CNTT-K18', 2024, '0900000001'
FROM users u
WHERE u.email = 'student.demo@gmail.com'
  AND NOT EXISTS (
    SELECT 1 FROM students s WHERE s.user_id = u.id
  );

INSERT INTO lecturers (user_id, lecturer_code, department, specialization, academic_title, phone)
SELECT u.id, 'GV001', 'Khoa Cong nghe thong tin', 'Tri tue nhan tao', 'ThS.', '0900000002'
FROM users u
WHERE u.email = 'lecturer.demo@gmail.com'
  AND NOT EXISTS (
    SELECT 1 FROM lecturers l WHERE l.user_id = u.id
  );