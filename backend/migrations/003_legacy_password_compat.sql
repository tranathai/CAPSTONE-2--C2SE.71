SET @has_password_col = (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'password'
);

SET @sql = IF(
  @has_password_col > 0,
  'ALTER TABLE users MODIFY COLUMN password VARCHAR(255) NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_password_hash_col = (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'password_hash'
);

SET @sql = IF(
  @has_password_col > 0 AND @has_password_hash_col > 0,
  'UPDATE users SET password = COALESCE(NULLIF(password, ''''), password_hash)',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
