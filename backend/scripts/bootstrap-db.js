import mysql from "mysql2/promise";

async function run() {
  const conn = await mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: "root",
    password: "123456",
    database: "mentor_ai_grad",
  });

  const statements = [
    "CREATE TABLE IF NOT EXISTS roles (id INT PRIMARY KEY, name VARCHAR(50) NOT NULL)",
    "CREATE TABLE IF NOT EXISTS users (id INT PRIMARY KEY, full_name VARCHAR(120) NOT NULL, email VARCHAR(190) NOT NULL, role_id INT NOT NULL)",
    "CREATE TABLE IF NOT EXISTS teams (id INT PRIMARY KEY, name VARCHAR(190) NOT NULL)",
    "CREATE TABLE IF NOT EXISTS team_members (team_id INT NOT NULL, user_id INT NOT NULL, is_leader TINYINT(1) NOT NULL DEFAULT 0, PRIMARY KEY (team_id, user_id))",
    "CREATE TABLE IF NOT EXISTS milestones (id INT PRIMARY KEY, name VARCHAR(190) NOT NULL)",
    "CREATE TABLE IF NOT EXISTS submissions (id INT AUTO_INCREMENT PRIMARY KEY, team_id INT NOT NULL, milestone_id INT NULL, title VARCHAR(255) NOT NULL)",
    "CREATE TABLE IF NOT EXISTS submission_versions (id INT AUTO_INCREMENT PRIMARY KEY, submission_id INT NOT NULL, version_number INT NOT NULL, file_path VARCHAR(500) NOT NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)",
    "CREATE TABLE IF NOT EXISTS feedbacks (id INT AUTO_INCREMENT PRIMARY KEY, submission_version_id INT NOT NULL, supervisor_id INT NOT NULL, content TEXT NOT NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)",
  ];

  for (const sql of statements) {
    await conn.query(sql);
  }

  await conn.query(
    "INSERT INTO roles (id, name) VALUES (1, 'student'), (2, 'supervisor') ON DUPLICATE KEY UPDATE name = VALUES(name)",
  );
  await conn.query(
    "INSERT INTO users (id, full_name, email, role_id) VALUES (1, 'Alex Smith', 'alex@example.com', 1), (2, 'Dr. Smith', 'dr.smith@example.com', 2) ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), email = VALUES(email), role_id = VALUES(role_id)",
  );
  await conn.query(
    "INSERT INTO teams (id, name) VALUES (1, 'CS-401 Senior Capstone') ON DUPLICATE KEY UPDATE name = VALUES(name)",
  );
  await conn.query(
    "INSERT INTO team_members (team_id, user_id, is_leader) VALUES (1, 1, 1) ON DUPLICATE KEY UPDATE is_leader = VALUES(is_leader)",
  );
  await conn.query(
    "INSERT INTO milestones (id, name) VALUES (1, 'Proposal'), (2, 'Mid-term report'), (3, 'Final report') ON DUPLICATE KEY UPDATE name = VALUES(name)",
  );
  await conn.query(
    "INSERT INTO submissions (id, team_id, milestone_id, title) VALUES (1, 1, 3, 'Final Technical Report') ON DUPLICATE KEY UPDATE team_id = VALUES(team_id), milestone_id = VALUES(milestone_id), title = VALUES(title)",
  );
  await conn.query(
    "INSERT INTO submission_versions (id, submission_id, version_number, file_path, created_at) VALUES (1, 1, 1, '/uploads/reports/final-report-v1.pdf', NOW() - INTERVAL 7 DAY), (2, 1, 2, '/uploads/reports/final-report-v2.pdf', NOW() - INTERVAL 1 DAY) ON DUPLICATE KEY UPDATE submission_id = VALUES(submission_id), version_number = VALUES(version_number), file_path = VALUES(file_path), created_at = VALUES(created_at)",
  );
  await conn.query(
    "INSERT INTO feedbacks (id, submission_version_id, supervisor_id, content, created_at) VALUES (1, 2, 2, 'Cau truc bao cao tot. Can bo sung API edge-case.', NOW() - INTERVAL 10 HOUR), (2, 2, 2, 'Phan benchmark ro rang, da cai thien.', NOW() - INTERVAL 2 HOUR) ON DUPLICATE KEY UPDATE submission_version_id = VALUES(submission_version_id), supervisor_id = VALUES(supervisor_id), content = VALUES(content), created_at = VALUES(created_at)",
  );

  await conn.end();
  console.log("Bootstrap DB complete.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
