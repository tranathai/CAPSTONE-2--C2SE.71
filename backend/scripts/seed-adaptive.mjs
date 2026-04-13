import "dotenv/config";
import mysql from "mysql2/promise";

async function run() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  await db.query(`
    INSERT INTO roles (id, name, display_name)
    VALUES
      (1, 'student', 'Student'),
      (2, 'supervisor', 'Supervisor')
    ON DUPLICATE KEY UPDATE
      name = VALUES(name),
      display_name = VALUES(display_name)
  `);

  await db.query(`
    INSERT INTO users (id, email, password, name, phone, avatar, role_id, status)
    VALUES
      (1, 'alex@example.com', '123456', 'Alex Smith', '0900000001', NULL, 1, 'active'),
      (2, 'dr.smith@example.com', '123456', 'Dr. Smith', '0900000002', NULL, 2, 'active')
    ON DUPLICATE KEY UPDATE
      email = VALUES(email),
      name = VALUES(name),
      role_id = VALUES(role_id),
      status = VALUES(status)
  `);

  await db.query(`
    INSERT INTO teams (id, name, invite_code)
    VALUES (1, 'CS-401 Senior Capstone', 'CS401')
    ON DUPLICATE KEY UPDATE
      name = VALUES(name),
      invite_code = VALUES(invite_code)
  `);

  await db.query(`
    INSERT INTO team_members (team_id, user_id, is_leader)
    VALUES (1, 1, 1)
    ON DUPLICATE KEY UPDATE
      is_leader = VALUES(is_leader)
  `);

  await db.query(`
    INSERT INTO milestones (id, name, description, start_date, end_date)
    VALUES
      (1, 'Proposal', 'Initial proposal', NULL, NULL),
      (2, 'Mid-term report', 'Mid-term deliverable', NULL, NULL),
      (3, 'Final report', 'Final deliverable', NULL, NULL)
    ON DUPLICATE KEY UPDATE
      name = VALUES(name),
      description = VALUES(description)
  `);

  await db.query(`
    INSERT INTO submissions (id, team_id, milestone_id)
    VALUES (1, 1, 3)
    ON DUPLICATE KEY UPDATE
      team_id = VALUES(team_id),
      milestone_id = VALUES(milestone_id)
  `);

  await db.query(`
    INSERT INTO submission_versions (id, submission_id, file_path, version_number, submitted_at, status)
    VALUES
      (1, 1, '/uploads/reports/final-report-v1.pdf', 1, NOW() - INTERVAL 7 DAY, 'on-time'),
      (2, 1, '/uploads/reports/final-report-v2.pdf', 2, NOW() - INTERVAL 1 DAY, 'on-time')
    ON DUPLICATE KEY UPDATE
      file_path = VALUES(file_path),
      version_number = VALUES(version_number),
      submitted_at = VALUES(submitted_at),
      status = VALUES(status)
  `);

  await db.query(`
    INSERT INTO feedbacks (id, submission_version_id, supervisor_id, content, created_at)
    VALUES
      (1, 2, 2, 'Cau truc bao cao tot. Can bo sung edge-case API.', NOW() - INTERVAL 10 HOUR),
      (2, 2, 2, 'Benchmark ro rang, cai thien tot so voi phien ban truoc.', NOW() - INTERVAL 2 HOUR)
    ON DUPLICATE KEY UPDATE
      content = VALUES(content),
      created_at = VALUES(created_at)
  `);

  await db.end();
  console.log("Adaptive seed completed.");
}

run().catch((error) => {
  console.error("Adaptive seed failed:", error.message);
  process.exit(1);
});
