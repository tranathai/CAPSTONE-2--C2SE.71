import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __bootstrapDir = path.dirname(fileURLToPath(import.meta.url));

/** File demo seed (gitignore uploads/) — tạo PDF tối thiểu nếu thiếu để /uploads không 404. */
function ensureSampleReportPdfs() {
  const dir = path.join(__bootstrapDir, "..", "..", "uploads", "reports");
  try {
    fs.mkdirSync(dir, { recursive: true });
    const minimalPdf = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R>>endobj
xref
0 4
0000000000 65535 f 
0000000009 00000 n 
0000000052 00000 n 
0000000105 00000 n 
trailer<</Size 4/Root 1 0 R>>
startxref
190
%%EOF
`;
    for (const name of [
      "proposal-v1.pdf",
      "proposal-final.pdf",
      "final-report-v1.pdf",
      "final-report-v2.pdf",
    ]) {
      const fp = path.join(dir, name);
      if (!fs.existsSync(fp)) fs.writeFileSync(fp, minimalPdf, "utf8");
    }
  } catch (e) {
    console.warn("[Bootstrap] Could not write sample PDFs:", e.message);
  }
}

async function ensureMilestonesRequiredDocumentsColumn(conn) {
  const db = process.env.DB_NAME || "mentorai_grad";
  const [cols] = await conn.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'milestones' AND COLUMN_NAME = 'required_documents'`,
    [db],
  );
  if (cols.length > 0) return;
  try {
    await conn.query(`ALTER TABLE milestones ADD COLUMN required_documents TEXT NULL`);
    console.log("[Bootstrap] milestones.required_documents column added.");
  } catch (e) {
    console.warn("[Bootstrap] Could not add milestones.required_documents:", e.message);
  }
}

async function ensureTeamsSupervisorColumn(conn) {
  const db = process.env.DB_NAME || "mentorai_grad";
  const [cols] = await conn.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'teams' AND COLUMN_NAME = 'supervisor_user_id'`,
    [db],
  );
  if (cols.length > 0) return;
  try {
    await conn.query(`ALTER TABLE teams ADD COLUMN supervisor_user_id BIGINT UNSIGNED NULL AFTER leader_user_id`);
    await conn.query(
      `ALTER TABLE teams ADD CONSTRAINT fk_team_supervisor FOREIGN KEY (supervisor_user_id) REFERENCES users(id) ON DELETE SET NULL`,
    );
    console.log("[Bootstrap] teams.supervisor_user_id column added.");
  } catch (e) {
    console.warn("[Bootstrap] Could not add teams.supervisor_user_id:", e.message);
  }
}

async function ensureFeedbacksAiSummaryColumn(conn) {
  const db = process.env.DB_NAME || "mentorai_grad";
  const [cols] = await conn.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'feedbacks' AND COLUMN_NAME = 'ai_summary'`,
    [db],
  );
  if (cols.length > 0) return;
  try {
    await conn.query(`ALTER TABLE feedbacks ADD COLUMN ai_summary TEXT NULL`);
    console.log("[Bootstrap] feedbacks.ai_summary column added.");
  } catch (e) {
    console.warn("[Bootstrap] Could not add feedbacks.ai_summary:", e.message);
  }
}

async function ensureMilestonesGraduationBatchColumn(conn) {
  const db = process.env.DB_NAME || "mentorai_grad";
  const [cols] = await conn.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'milestones' AND COLUMN_NAME = 'graduation_batch_id'`,
    [db],
  );
  if (cols.length > 0) return;
  try {
    await conn.query(`ALTER TABLE milestones ADD COLUMN graduation_batch_id INT UNSIGNED NULL`);
    await conn.query(
      `ALTER TABLE milestones ADD CONSTRAINT fk_milestones_graduation_batch FOREIGN KEY (graduation_batch_id) REFERENCES graduation_batches(id) ON DELETE SET NULL`,
    );
    console.log("[Bootstrap] milestones.graduation_batch_id column added.");
  } catch (e) {
    console.warn("[Bootstrap] Could not add milestones.graduation_batch_id:", e.message);
  }
}

async function ensureTopicRegistrationStatusEnum(conn) {
  const db = process.env.DB_NAME || "mentorai_grad";
  const [rows] = await conn.query(
    `SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'topic_registrations' AND COLUMN_NAME = 'status'`,
    [db],
  );
  const col = rows[0]?.COLUMN_TYPE || "";
  if (String(col).includes("completed")) return;
  try {
    await conn.query(`
      ALTER TABLE topic_registrations
      MODIFY COLUMN status ENUM('pending','approved','rejected','completed') NOT NULL DEFAULT 'pending'
    `);
    console.log("[Bootstrap] topic_registrations.status: added 'completed' for new topic cycles.");
  } catch (e) {
    console.warn("[Bootstrap] Could not extend topic_registrations.status enum:", e.message);
  }
}

async function ensureTopicRegistrationMilestonesColumn(conn) {
  const db = process.env.DB_NAME || "mentorai_grad";
  const [cols] = await conn.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'topic_registrations' AND COLUMN_NAME = 'selected_milestone_ids'`,
    [db],
  );
  if (cols.length > 0) return;
  try {
    await conn.query(`ALTER TABLE topic_registrations ADD COLUMN selected_milestone_ids TEXT NULL`);
    console.log("[Bootstrap] topic_registrations.selected_milestone_ids added.");
  } catch (e) {
    console.warn("[Bootstrap] Could not add topic_registrations.selected_milestone_ids:", e.message);
  }
}

async function ensureMessagingTopicsColumns(conn) {
  const db = process.env.DB_NAME || "mentorai_grad";
  const [cols] = await conn.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'messages' AND COLUMN_NAME = 'topic_id'`,
    [db],
  );
  if (cols.length > 0) return;

  await conn.query(`ALTER TABLE messages ADD COLUMN topic_id INT UNSIGNED NULL`);
  await conn.query(`
    ALTER TABLE messages ADD CONSTRAINT fk_messages_topic_id FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE SET NULL
  `);
}

async function ensureMessagingTeamsColumn(conn) {
  const db = process.env.DB_NAME || "mentorai_grad";
  const [cols] = await conn.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'messages' AND COLUMN_NAME = 'team_id'`,
    [db],
  );
  if (cols.length > 0) return;

  await conn.query(`ALTER TABLE messages ADD COLUMN team_id INT UNSIGNED NULL`);
  await conn.query(`
    ALTER TABLE messages ADD CONSTRAINT fk_messages_team_id FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
  `);
}

async function ensureMessagesMetaColumns(conn) {
  const db = process.env.DB_NAME || "mentorai_grad";
  const columns = [
    {
      name: "message_kind",
      sql: `ALTER TABLE messages ADD COLUMN message_kind ENUM('chat','system') NOT NULL DEFAULT 'chat'`,
    },
    {
      name: "is_deleted",
      sql: `ALTER TABLE messages ADD COLUMN is_deleted TINYINT(1) NOT NULL DEFAULT 0`,
    },
    {
      name: "updated_at",
      sql: `ALTER TABLE messages ADD COLUMN updated_at DATETIME NULL`,
    },
  ];

  for (const col of columns) {
    const [cols] = await conn.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'messages' AND COLUMN_NAME = ?`,
      [db, col.name],
    );
    if (cols.length > 0) continue;
    try {
      await conn.query(col.sql);
      console.log(`[Bootstrap] messages.${col.name} added.`);
    } catch (e) {
      console.warn(`[Bootstrap] Could not add messages.${col.name}:`, e.message);
    }
  }
}

/**
 * Auto-create database + all tables if they don't exist.
 * Safe to run on every startup — uses CREATE TABLE IF NOT EXISTS.
 */
export async function bootstrapDatabase() {
  const cfg = {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD ?? "",
  };

  // Connect without database first to create it
  const rootConn = await mysql.createConnection(cfg);

  try {
    await rootConn.query(
      `CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || "mentorai_grad"}\`
       CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    );
    console.log(`[Bootstrap] Database '${process.env.DB_NAME || "mentorai_grad"}' ensured.`);
  } finally {
    await rootConn.end();
  }

  // Now connect WITH database and create tables
  const conn = await mysql.createConnection({
    ...cfg,
    database: process.env.DB_NAME || "mentorai_grad",
    multipleStatements: true,
  });

  try {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(50) NOT NULL UNIQUE
      )
    `);

    await conn.query(`
      INSERT IGNORE INTO roles (name) VALUES ('admin'), ('student'), ('supervisor')
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS users (
        id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        role_id INT UNSIGNED NOT NULL,
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        phone VARCHAR(20) DEFAULT NULL,
        avatar_url VARCHAR(500) DEFAULT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (role_id) REFERENCES roles(id)
      )
    `);

    await migrateLegacyUsersIfNeeded(conn);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS student_profiles (
        user_id BIGINT UNSIGNED PRIMARY KEY,
        student_code VARCHAR(50) DEFAULT NULL,
        class_name VARCHAR(100) DEFAULT NULL,
        major VARCHAR(255) DEFAULT NULL,
        enrollment_year SMALLINT UNSIGNED DEFAULT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS supervisor_profiles (
        user_id BIGINT UNSIGNED PRIMARY KEY,
        lecturer_code VARCHAR(50) DEFAULT NULL,
        department VARCHAR(255) DEFAULT NULL,
        specialization VARCHAR(255) DEFAULT NULL,
        academic_title VARCHAR(100) DEFAULT NULL,
        office_address VARCHAR(255) DEFAULT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS teams (
        id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        description TEXT DEFAULT NULL,
        semester VARCHAR(50) DEFAULT NULL,
        leader_user_id BIGINT UNSIGNED DEFAULT NULL,
        supervisor_user_id BIGINT UNSIGNED DEFAULT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (leader_user_id) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (supervisor_user_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);
    await ensureTeamsSupervisorColumn(conn);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS team_members (
        team_id INT UNSIGNED NOT NULL,
        user_id BIGINT UNSIGNED NOT NULL,
        is_leader TINYINT(1) NOT NULL DEFAULT 0,
        joined_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (team_id, user_id),
        FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS graduation_batches (
        id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        description TEXT DEFAULT NULL,
        start_date DATETIME DEFAULT NULL,
        end_date DATETIME DEFAULT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS milestones (
        id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        description TEXT DEFAULT NULL,
        start_date DATETIME NOT NULL,
        end_date DATETIME NOT NULL,
        deadline_type ENUM('soft','hard') NOT NULL DEFAULT 'soft',
        display_order INT UNSIGNED NOT NULL DEFAULT 0,
        required_documents TEXT DEFAULT NULL,
        graduation_batch_id INT UNSIGNED DEFAULT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (graduation_batch_id) REFERENCES graduation_batches(id) ON DELETE SET NULL
      )
    `);

    await ensureMilestonesRequiredDocumentsColumn(conn);
    await ensureMilestonesGraduationBatchColumn(conn);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS topic_registrations (
        id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
        team_id INT UNSIGNED NOT NULL,
        title VARCHAR(500) NOT NULL,
        description TEXT DEFAULT NULL,
        technologies TEXT DEFAULT NULL,
        status ENUM('pending','approved','rejected','completed') NOT NULL DEFAULT 'pending',
        supervisor_id BIGINT UNSIGNED DEFAULT NULL,
        rejection_reason TEXT DEFAULT NULL,
        selected_milestone_ids TEXT DEFAULT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
        FOREIGN KEY (supervisor_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    await ensureTopicRegistrationStatusEnum(conn);
    await ensureTopicRegistrationMilestonesColumn(conn);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS submissions (
        id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
        team_id INT UNSIGNED NOT NULL,
        milestone_id INT UNSIGNED DEFAULT NULL,
        title VARCHAR(255) NOT NULL,
        submitted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        status_label VARCHAR(50) DEFAULT 'Pending Review',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
        FOREIGN KEY (milestone_id) REFERENCES milestones(id) ON DELETE SET NULL
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS submission_versions (
        id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
        submission_id INT UNSIGNED NOT NULL,
        version_number INT UNSIGNED NOT NULL DEFAULT 1,
        file_path VARCHAR(500) NOT NULL,
        original_filename VARCHAR(255) DEFAULT NULL,
        file_size BIGINT UNSIGNED DEFAULT NULL,
        submitted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        is_late TINYINT(1) NOT NULL DEFAULT 0,
        FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS feedbacks (
        id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
        submission_version_id INT UNSIGNED NOT NULL,
        supervisor_id BIGINT UNSIGNED NOT NULL,
        content TEXT NOT NULL,
        is_final TINYINT(1) NOT NULL DEFAULT 0,
        ai_summary TEXT DEFAULT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (submission_version_id) REFERENCES submission_versions(id) ON DELETE CASCADE,
        FOREIGN KEY (supervisor_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await ensureFeedbacksAiSummaryColumn(conn);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS meetings (
        id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
        title VARCHAR(500) NOT NULL,
        description TEXT DEFAULT NULL,
        scheduled_at DATETIME NOT NULL,
        duration_minutes INT UNSIGNED DEFAULT 60,
        team_id INT UNSIGNED DEFAULT NULL,
        host_id BIGINT UNSIGNED NOT NULL,
        meeting_url VARCHAR(500) DEFAULT NULL,
        location VARCHAR(255) DEFAULT NULL,
        status ENUM('scheduled','cancelled','completed') NOT NULL DEFAULT 'scheduled',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL,
        FOREIGN KEY (host_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS meeting_participants (
        meeting_id INT UNSIGNED NOT NULL,
        user_id BIGINT UNSIGNED NOT NULL,
        PRIMARY KEY (meeting_id, user_id),
        FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS meeting_requests (
        id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
        team_id INT UNSIGNED NOT NULL,
        requester_id BIGINT UNSIGNED NOT NULL,
        supervisor_id BIGINT UNSIGNED NOT NULL,
        title VARCHAR(500) NOT NULL,
        reason TEXT DEFAULT NULL,
        proposed_at DATETIME NOT NULL,
        status ENUM('pending','approved','declined') NOT NULL DEFAULT 'pending',
        response_reason TEXT DEFAULT NULL,
        response_at DATETIME DEFAULT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
        FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (supervisor_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS topics (
        id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
        team_id INT UNSIGNED NOT NULL,
        title VARCHAR(500) NOT NULL,
        description TEXT DEFAULT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
        sender_id BIGINT UNSIGNED NOT NULL,
        receiver_id BIGINT UNSIGNED NOT NULL,
        content TEXT NOT NULL,
        is_read TINYINT(1) NOT NULL DEFAULT 0,
        topic_id INT UNSIGNED DEFAULT NULL,
        team_id INT UNSIGNED DEFAULT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE SET NULL,
        FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
      )
    `);

    await ensureMessagingTopicsColumns(conn);
    await ensureMessagingTeamsColumn(conn);
    await ensureMessagesMetaColumns(conn);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
        user_id BIGINT UNSIGNED NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type ENUM('info','deadline','feedback','meeting','system') NOT NULL DEFAULT 'info',
        is_read TINYINT(1) NOT NULL DEFAULT 0,
        related_url VARCHAR(500) DEFAULT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS system_config (
        id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
        config_key VARCHAR(100) NOT NULL UNIQUE,
        config_value TEXT DEFAULT NULL,
        description VARCHAR(500) DEFAULT NULL,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    console.log("[Bootstrap] All tables ensured.");
  } finally {
    await conn.end();
  }

  // Seed initial data
  await seedData(cfg);
  ensureSampleReportPdfs();
}

/** Old DBs used users.role ENUM; app expects users.role_id → roles. */
async function migrateLegacyUsersIfNeeded(conn) {
  const db = process.env.DB_NAME || "mentorai_grad";
  const [tables] = await conn.query(
    `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users'`,
    [db],
  );
  if (!tables.length) return;

  const [cols] = await conn.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users'`,
    [db],
  );
  const colSet = new Set(cols.map((r) => r.COLUMN_NAME));
  if (colSet.has("role_id")) return;

  if (!colSet.has("role")) {
    console.warn("[Bootstrap] users has no role_id or legacy role column; skip legacy migration.");
    return;
  }

  await conn.query(`ALTER TABLE users ADD COLUMN role_id INT UNSIGNED NULL`);
  await conn.query(`
    UPDATE users u
    SET u.role_id = (
      CASE u.role
        WHEN 'student' THEN (SELECT id FROM roles WHERE name = 'student' LIMIT 1)
        WHEN 'teacher' THEN (SELECT id FROM roles WHERE name = 'supervisor' LIMIT 1)
      END
    )
  `);
  await conn.query(`
    UPDATE users SET role_id = (SELECT id FROM roles WHERE name = 'student' LIMIT 1) WHERE role_id IS NULL
  `);
  await conn.query(`ALTER TABLE users MODIFY COLUMN role_id INT UNSIGNED NOT NULL`);
  await conn.query(`ALTER TABLE users ADD CONSTRAINT fk_users_role_id FOREIGN KEY (role_id) REFERENCES roles(id)`);
  await conn.query(`ALTER TABLE users DROP COLUMN role`);
  if (!colSet.has("phone")) await conn.query(`ALTER TABLE users ADD COLUMN phone VARCHAR(20) DEFAULT NULL`);
  if (!colSet.has("avatar_url")) await conn.query(`ALTER TABLE users ADD COLUMN avatar_url VARCHAR(500) DEFAULT NULL`);
  console.log("[Bootstrap] Migrated legacy users.role enum to role_id.");
}

async function seedData(cfg) {
  const conn = await mysql.createConnection({
    ...cfg,
    database: process.env.DB_NAME || "mentorai_grad",
  });

  try {
    // Roles
    await conn.query(`
      INSERT IGNORE INTO roles (name) VALUES ('admin'), ('student'), ('supervisor')
    `);

    // Check if admin exists
    const [adminRows] = await conn.query(
      `SELECT id FROM users WHERE email = 'admin@mentorai.edu' LIMIT 1`,
    );

    if (!adminRows || adminRows.length === 0) {
      const adminHash = await bcrypt.hash("admin123", 10);
      const studentHash = await bcrypt.hash("student123", 10);
      const superHash = await bcrypt.hash("super123", 10);

      // Insert users one by one to get IDs
      await conn.query(`
        INSERT IGNORE INTO users (email, password_hash, full_name, role_id, is_active) VALUES
        ('admin@mentorai.edu', ?, 'Quản trị viên', 1, 1)
      `, [adminHash]);

      await conn.query(`
        INSERT IGNORE INTO users (email, password_hash, full_name, role_id, is_active) VALUES
        ('nguyen.van.a@student.edu.vn', ?, 'Nguyễn Văn A', 2, 1)
      `, [studentHash]);

      await conn.query(`
        INSERT IGNORE INTO users (email, password_hash, full_name, role_id, is_active) VALUES
        ('tran.thi.b@student.edu.vn', ?, 'Trần Thị B', 2, 1)
      `, [studentHash]);

      await conn.query(`
        INSERT IGNORE INTO users (email, password_hash, full_name, role_id, is_active) VALUES
        ('le.van.c@student.edu.vn', ?, 'Lê Văn C', 2, 1)
      `, [studentHash]);

      await conn.query(`
        INSERT IGNORE INTO users (email, password_hash, full_name, role_id, is_active) VALUES
        ('ts.nguyen@mentorai.edu', ?, 'Ts. Nguyễn Văn Giảng', 3, 1)
      `, [superHash]);

      await conn.query(`
        INSERT IGNORE INTO users (email, password_hash, full_name, role_id, is_active) VALUES
        ('ths.pham@mentorai.edu', ?, 'Ths. Phạm Thị Giảng', 3, 1)
      `, [superHash]);

      // Student profiles
      const [sv1Rows] = await conn.query(`SELECT id FROM users WHERE email='nguyen.van.a@student.edu.vn'`);
      const [sv2Rows] = await conn.query(`SELECT id FROM users WHERE email='tran.thi.b@student.edu.vn'`);
      const [sv3Rows] = await conn.query(`SELECT id FROM users WHERE email='le.van.c@student.edu.vn'`);
      const [gv1Rows] = await conn.query(`SELECT id FROM users WHERE email='ts.nguyen@mentorai.edu'`);
      const [gv2Rows] = await conn.query(`SELECT id FROM users WHERE email='ths.pham@mentorai.edu'`);

      const sv1Id = sv1Rows[0]?.id;
      const sv2Id = sv2Rows[0]?.id;
      const sv3Id = sv3Rows[0]?.id;
      const gv1Id = gv1Rows[0]?.id;
      const gv2Id = gv2Rows[0]?.id;

      if (sv1Id) {
        await conn.query(`INSERT IGNORE INTO student_profiles (user_id, student_code, class_name, major, enrollment_year) VALUES (?, 'SV001', 'CNTT-K18', 'Công nghệ thông tin', 2024)`, [sv1Id]);
      }
      if (sv2Id) {
        await conn.query(`INSERT IGNORE INTO student_profiles (user_id, student_code, class_name, major, enrollment_year) VALUES (?, 'SV002', 'CNTT-K18', 'Công nghệ thông tin', 2024)`, [sv2Id]);
      }
      if (sv3Id) {
        await conn.query(`INSERT IGNORE INTO student_profiles (user_id, student_code, class_name, major, enrollment_year) VALUES (?, 'SV003', 'CNTT-K18', 'Công nghệ thông tin', 2024)`, [sv3Id]);
      }

      // Supervisor profiles
      if (gv1Id) {
        await conn.query(`INSERT IGNORE INTO supervisor_profiles (user_id, lecturer_code, department, specialization, academic_title) VALUES (?, 'GV001', 'Khoa Công nghệ thông tin', 'Trí tuệ nhân tạo', 'Tiến sĩ')`, [gv1Id]);
      }
      if (gv2Id) {
        await conn.query(`INSERT IGNORE INTO supervisor_profiles (user_id, lecturer_code, department, specialization, academic_title) VALUES (?, 'GV002', 'Khoa Công nghệ thông tin', 'Khoa học dữ liệu', 'Thạc sĩ')`, [gv2Id]);
      }

      // Teams
      if (sv1Id && sv2Id) {
        const [team1Result] = await conn.query(`
          INSERT INTO teams (name, description, semester, leader_user_id) VALUES
          ('CS-401 Nhóm Capstone 1', 'Nhóm dự án capstone công nghệ thông tin', '2024-1', ?)
        `, [sv1Id]);
        const team1Id = team1Result.insertId;

        const [team2Result] = await conn.query(`
          INSERT INTO teams (name, description, semester, leader_user_id) VALUES
          ('CS-401 Nhóm Capstone 2', 'Nhóm dự án thứ hai', '2024-1', ?)
        `, [sv2Id]);
        const team2Id = team2Result.insertId;

        // Team members
        if (sv1Id) await conn.query(`INSERT IGNORE INTO team_members (team_id, user_id, is_leader) VALUES (?, ?, 1)`, [team1Id, sv1Id]);
        if (sv2Id) await conn.query(`INSERT IGNORE INTO team_members (team_id, user_id, is_leader) VALUES (?, ?, 0)`, [team1Id, sv2Id]);
        if (sv3Id) await conn.query(`INSERT IGNORE INTO team_members (team_id, user_id, is_leader) VALUES (?, ?, 0)`, [team1Id, sv3Id]);
        if (sv2Id) await conn.query(`INSERT IGNORE INTO team_members (team_id, user_id, is_leader) VALUES (?, ?, 1)`, [team2Id, sv2Id]);

        // Graduation batch (Đợt tốt nghiệp)
        const [batchResult] = await conn.query(
          `INSERT INTO graduation_batches (name, description, start_date, end_date)
           VALUES ('Đợt tốt nghiệp mặc định', 'Đợt mặc định cho dữ liệu mẫu', DATE_SUB(NOW(), INTERVAL 70 DAY), DATE_ADD(NOW(), INTERVAL 80 DAY))`,
        );
        const defaultBatchId = batchResult.insertId;

        // Milestones
        await conn.query(`
          INSERT IGNORE INTO milestones (name, description, start_date, end_date, deadline_type, display_order, graduation_batch_id) VALUES
          ('Proposal', 'Nộp đề cương dự án', DATE_SUB(NOW(), INTERVAL 60 DAY), DATE_ADD(NOW(), INTERVAL -15 DAY), 'hard', 1, ?),
          ('Mid-term Report', 'Báo cáo giữa kỳ', DATE_ADD(NOW(), INTERVAL -10 DAY), DATE_ADD(NOW(), INTERVAL 20 DAY), 'soft', 2, ?),
          ('Final Report', 'Báo cáo cuối kỳ', DATE_ADD(NOW(), INTERVAL 25 DAY), DATE_ADD(NOW(), INTERVAL 60 DAY), 'soft', 3, ?)
        `, [defaultBatchId, defaultBatchId, defaultBatchId]);

        // Topic registrations
        if (gv1Id) {
          await conn.query(`
            INSERT IGNORE INTO topic_registrations (team_id, title, description, technologies, status, supervisor_id) VALUES
            (?, 'Hệ thống quản lý đồ án capstone với AI', 'Xây dựng hệ thống quản lý đồ án sử dụng AI để gợi ý và đánh giá', 'React, Node.js, MySQL, Gemini API', 'approved', ?)
          `, [team1Id, gv1Id]);
        }

        if (gv2Id) {
          await conn.query(`
            INSERT IGNORE INTO topic_registrations (team_id, title, description, technologies, status, supervisor_id) VALUES
            (?, 'Ứng dụng học máy trong phân tích dữ liệu giáo dục', 'Nghiên cứu và triển khai mô hình ML cho phân tích dữ liệu học tập', 'Python, TensorFlow, PostgreSQL', 'pending', ?)
          `, [team2Id, gv2Id]);
        }

        // Milestone IDs for submissions
        const [msRows] = await conn.query(`SELECT id FROM milestones ORDER BY display_order`);
        const proposalMsId = msRows[0]?.id;
        const midTermMsId = msRows[1]?.id;

        // Submissions & versions & feedbacks
        if (proposalMsId) {
          const [sub1Result] = await conn.query(`
            INSERT INTO submissions (team_id, milestone_id, title, status_label) VALUES (?, ?, 'Đề cương dự án AI Mentor', 'Reviewed')
          `, [team1Id, proposalMsId]);
          const sub1Id = sub1Result.insertId;

          if (sub1Id && gv1Id) {
            const [ver1Result] = await conn.query(`
              INSERT INTO submission_versions (submission_id, version_number, file_path, original_filename, is_late) VALUES (?, 1, '/uploads/reports/proposal-v1.pdf', 'proposal-v1.pdf', 0)
            `, [sub1Id]);
            const ver1Id = ver1Result.insertId;

            const [ver2Result] = await conn.query(`
              INSERT INTO submission_versions (submission_id, version_number, file_path, original_filename, is_late) VALUES (?, 2, '/uploads/reports/proposal-final.pdf', 'proposal-final.pdf', 0)
            `, [sub1Id]);
            const ver2Id = ver2Result.insertId;

            if (ver1Id) {
              await conn.query(`
                INSERT INTO feedbacks (submission_version_id, supervisor_id, content, is_final) VALUES
                (?, ?, 'Cấu trúc đề cương tốt. Cần bổ sung phần tài liệu tham khảo và mô tả chi tiết hơn về API integration.', 0)
              `, [ver1Id, gv1Id]);
            }
            if (ver2Id) {
              await conn.query(`
                INSERT INTO feedbacks (submission_version_id, supervisor_id, content, is_final) VALUES
                (?, ?, 'Đề cương đã được chỉnh sửa tốt. Phần API integration đã rõ ràng. Đạt yêu cầu. Có thể tiến hành triển khai.', 1)
              `, [ver2Id, gv1Id]);
            }
          }
        }

        if (midTermMsId) {
          const [sub2Result] = await conn.query(`
            INSERT INTO submissions (team_id, milestone_id, title, status_label) VALUES (?, ?, 'Báo cáo giữa kỳ - Tiến độ học tập', 'Pending Review')
          `, [team1Id, midTermMsId]);
        }
      }

      console.log("[Bootstrap] Seed data inserted.");
    } else {
      console.log("[Bootstrap] Seed data already exists, skipping.");
    }
  } finally {
    await conn.end();
  }
}
