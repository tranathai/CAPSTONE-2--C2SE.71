import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";

/**
 * Auto-create database + all tables if they don't exist.
 * Safe to run on every startup — uses CREATE TABLE IF NOT EXISTS.
 */
export async function bootstrapDatabase() {
  const cfg = {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "admin",
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
        FOREIGN KEY (role_id) REFERENCES roles(id)
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS student_profiles (
        user_id INT UNSIGNED PRIMARY KEY,
        student_code VARCHAR(50) DEFAULT NULL,
        class_name VARCHAR(100) DEFAULT NULL,
        major VARCHAR(255) DEFAULT NULL,
        enrollment_year SMALLINT UNSIGNED DEFAULT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS supervisor_profiles (
        user_id INT UNSIGNED PRIMARY KEY,
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
        leader_user_id INT UNSIGNED DEFAULT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (leader_user_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS team_members (
        team_id INT UNSIGNED NOT NULL,
        user_id INT UNSIGNED NOT NULL,
        is_leader TINYINT(1) NOT NULL DEFAULT 0,
        joined_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (team_id, user_id),
        FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
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
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS topic_registrations (
        id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
        team_id INT UNSIGNED NOT NULL,
        title VARCHAR(500) NOT NULL,
        description TEXT DEFAULT NULL,
        technologies TEXT DEFAULT NULL,
        status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
        supervisor_id INT UNSIGNED DEFAULT NULL,
        rejection_reason TEXT DEFAULT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
        FOREIGN KEY (supervisor_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

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
        supervisor_id INT UNSIGNED NOT NULL,
        content TEXT NOT NULL,
        is_final TINYINT(1) NOT NULL DEFAULT 0,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (submission_version_id) REFERENCES submission_versions(id) ON DELETE CASCADE,
        FOREIGN KEY (supervisor_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await conn.query(`
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
        user_id INT UNSIGNED NOT NULL,
        PRIMARY KEY (meeting_id, user_id),
        FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS meeting_requests (
        id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
        team_id INT UNSIGNED NOT NULL,
        requester_id INT UNSIGNED NOT NULL,
        supervisor_id INT UNSIGNED NOT NULL,
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
      CREATE TABLE IF NOT EXISTS messages (
        id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
        sender_id INT UNSIGNED NOT NULL,
        receiver_id INT UNSIGNED NOT NULL,
        content TEXT NOT NULL,
        is_read TINYINT(1) NOT NULL DEFAULT 0,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
        user_id INT UNSIGNED NOT NULL,
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

        // Milestones
        await conn.query(`
          INSERT IGNORE INTO milestones (name, description, start_date, end_date, deadline_type, display_order) VALUES
          ('Proposal', 'Nộp đề cương dự án', DATE_SUB(NOW(), INTERVAL 60 DAY), DATE_ADD(NOW(), INTERVAL -15 DAY), 'hard', 1),
          ('Mid-term Report', 'Báo cáo giữa kỳ', DATE_ADD(NOW(), INTERVAL -10 DAY), DATE_ADD(NOW(), INTERVAL 20 DAY), 'soft', 2),
          ('Final Report', 'Báo cáo cuối kỳ', DATE_ADD(NOW(), INTERVAL 25 DAY), DATE_ADD(NOW(), INTERVAL 60 DAY), 'soft', 3)
        `);

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
