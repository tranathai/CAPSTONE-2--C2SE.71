CREATE TABLE IF NOT EXISTS login_otp_codes (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  otp_code VARCHAR(10) NOT NULL,
  expires_at DATETIME NOT NULL,
  used_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_login_otp_user_id (user_id),
  INDEX idx_login_otp_expires_at (expires_at)
);

CREATE TABLE IF NOT EXISTS teacher_requests (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  cv_file_path VARCHAR(500) NOT NULL,
  degree_file_path VARCHAR(500) NOT NULL,
  experience_text TEXT NOT NULL,
  status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  admin_note TEXT NULL,
  action_token VARCHAR(255) NOT NULL UNIQUE,
  token_expires_at DATETIME NOT NULL,
  decided_by INT NULL,
  decided_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_teacher_requests_user_id (user_id),
  INDEX idx_teacher_requests_status (status),
  INDEX idx_teacher_requests_token_expires (token_expires_at)
);

INSERT INTO roles (name)
SELECT 'student' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'student');
INSERT INTO roles (name)
SELECT 'supervisor' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'supervisor');
INSERT INTO roles (name)
SELECT 'admin' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'admin');

SET @sql = (
  SELECT IF(
    EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'full_name'
    ),
    'SELECT 1',
    'ALTER TABLE users ADD COLUMN full_name VARCHAR(120) NULL'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(
    EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'password_hash'
    ),
    'SELECT 1',
    'ALTER TABLE users ADD COLUMN password_hash VARCHAR(255) NULL'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(
    EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'phone'
    ),
    'SELECT 1',
    'ALTER TABLE users ADD COLUMN phone VARCHAR(30) NULL'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(
    EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'status'
    ),
    'SELECT 1',
    'ALTER TABLE users ADD COLUMN status ENUM(''active'',''inactive'') NOT NULL DEFAULT ''active'''
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

UPDATE users
SET full_name = COALESCE(NULLIF(full_name, ''), email)
WHERE full_name IS NULL OR full_name = '';

SET @has_name_col = (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'name'
);
SET @sql = IF(
  @has_name_col > 0,
  'UPDATE users SET full_name = COALESCE(NULLIF(full_name, ''''), NULLIF(name, ''''), email)',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_password_col = (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'password'
);
SET @sql = IF(
  @has_password_col > 0,
  'UPDATE users SET password_hash = COALESCE(NULLIF(password_hash, ''''), NULLIF(password, ''''))',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(
    EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = DATABASE() AND table_name = 'teams' AND column_name = 'invite_code'
    ),
    'SELECT 1',
    'ALTER TABLE teams ADD COLUMN invite_code VARCHAR(32) NULL'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(
    EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = DATABASE() AND table_name = 'teams' AND column_name = 'created_by'
    ),
    'SELECT 1',
    'ALTER TABLE teams ADD COLUMN created_by INT NULL'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(
    EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = DATABASE() AND table_name = 'milestones' AND column_name = 'description'
    ),
    'SELECT 1',
    'ALTER TABLE milestones ADD COLUMN description TEXT NULL'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(
    EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = DATABASE() AND table_name = 'milestones' AND column_name = 'start_date'
    ),
    'SELECT 1',
    'ALTER TABLE milestones ADD COLUMN start_date DATE NULL'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(
    EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = DATABASE() AND table_name = 'milestones' AND column_name = 'end_date'
    ),
    'SELECT 1',
    'ALTER TABLE milestones ADD COLUMN end_date DATE NULL'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(
    EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = DATABASE() AND table_name = 'milestones' AND column_name = 'sequence_no'
    ),
    'SELECT 1',
    'ALTER TABLE milestones ADD COLUMN sequence_no INT NOT NULL DEFAULT 0'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(
    EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = DATABASE() AND table_name = 'submissions' AND column_name = 'title'
    ),
    'SELECT 1',
    'ALTER TABLE submissions ADD COLUMN title VARCHAR(255) NULL'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(
    EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = DATABASE() AND table_name = 'submissions' AND column_name = 'status'
    ),
    'SELECT 1',
    'ALTER TABLE submissions ADD COLUMN status ENUM(''Pending Review'',''Reviewed'') NOT NULL DEFAULT ''Pending Review'''
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(
    EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = DATABASE() AND table_name = 'submissions' AND column_name = 'milestone_id'
    ),
    'SELECT 1',
    'ALTER TABLE submissions ADD COLUMN milestone_id INT NULL'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(
    EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = DATABASE() AND table_name = 'submission_versions' AND column_name = 'is_late'
    ),
    'SELECT 1',
    'ALTER TABLE submission_versions ADD COLUMN is_late TINYINT(1) NOT NULL DEFAULT 0'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(
    EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = DATABASE() AND table_name = 'submission_versions' AND column_name = 'created_at'
    ),
    'SELECT 1',
    'ALTER TABLE submission_versions ADD COLUMN created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(
    EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = DATABASE() AND table_name = 'topics' AND column_name = 'reviewed_by'
    ),
    'SELECT 1',
    'ALTER TABLE topics ADD COLUMN reviewed_by INT NULL'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(
    EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = DATABASE() AND table_name = 'topics' AND column_name = 'rejection_reason'
    ),
    'SELECT 1',
    'ALTER TABLE topics ADD COLUMN rejection_reason TEXT NULL'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(
    EXISTS (
      SELECT 1 FROM information_schema.statistics
      WHERE table_schema = DATABASE() AND table_name = 'teams' AND index_name = 'uk_teams_invite_code'
    ),
    'SELECT 1',
    'ALTER TABLE teams ADD UNIQUE KEY uk_teams_invite_code (invite_code)'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(
    EXISTS (
      SELECT 1 FROM information_schema.statistics
      WHERE table_schema = DATABASE() AND table_name = 'submission_versions' AND index_name = 'uk_submission_versions_submission_version'
    ),
    'SELECT 1',
    'ALTER TABLE submission_versions ADD UNIQUE KEY uk_submission_versions_submission_version (submission_id, version_number)'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
