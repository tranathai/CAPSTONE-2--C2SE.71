import pool from "../config/db.js";

export async function ensureFeatureSchema() {
  const statements = [
    `CREATE TABLE IF NOT EXISTS login_otp_codes (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      otp_code VARCHAR(10) NOT NULL,
      expires_at DATETIME NOT NULL,
      used_at DATETIME NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_login_otp_user_id (user_id)
    )`,
    `CREATE TABLE IF NOT EXISTS teacher_requests (
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
      INDEX idx_teacher_requests_status (status)
    )`,
  ];

  for (const sql of statements) {
    await pool.query(sql);
  }
}
