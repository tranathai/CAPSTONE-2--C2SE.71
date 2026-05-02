import mysql from "mysql2/promise";

async function run() {
  const conn = await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "123456",
    multipleStatements: true,
  });

  await conn.query(`CREATE DATABASE IF NOT EXISTS mentor_ai_grad`);
  await conn.query(`USE mentor_ai_grad`);

  const sql = `
  SET FOREIGN_KEY_CHECKS = 0;

  DROP TABLE IF EXISTS topic_technologies;
  DROP TABLE IF EXISTS technologies;
  DROP TABLE IF EXISTS risk_flags;
  DROP TABLE IF EXISTS risk_levels;
  DROP TABLE IF EXISTS ai_summaries;
  DROP TABLE IF EXISTS messages;
  DROP TABLE IF EXISTS conversation_members;
  DROP TABLE IF EXISTS conversations;
  DROP TABLE IF EXISTS notifications;
  DROP TABLE IF EXISTS system_logs;
  DROP TABLE IF EXISTS topic_reviews;
  DROP TABLE IF EXISTS topic_status;
  DROP TABLE IF EXISTS topics;
  DROP TABLE IF EXISTS feedbacks;
  DROP TABLE IF EXISTS submission_versions;
  DROP TABLE IF EXISTS submissions;
  DROP TABLE IF EXISTS milestones;
  DROP TABLE IF EXISTS team_members;
  DROP TABLE IF EXISTS teams;
  DROP TABLE IF EXISTS users;
  DROP TABLE IF EXISTS roles;

  SET FOREIGN_KEY_CHECKS = 1;

  -- ROLES
  CREATE TABLE roles (
    id INT PRIMARY KEY,
    name VARCHAR(50),
    display_name VARCHAR(100)
  );

  -- USERS
  CREATE TABLE users (
    id INT PRIMARY KEY,
    email VARCHAR(255),
    password VARCHAR(255),
    name VARCHAR(255),
    phone VARCHAR(20),
    avatar VARCHAR(255),
    role_id INT,
    status ENUM('active','inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id)
  );

  -- TEAMS
  CREATE TABLE teams (
    id INT PRIMARY KEY,
    name VARCHAR(255),
    invite_code VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  -- TEAM MEMBERS
  CREATE TABLE team_members (
    team_id INT,
    user_id INT,
    is_leader TINYINT(1),
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (team_id, user_id),
    FOREIGN KEY (team_id) REFERENCES teams(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  -- MILESTONES
  CREATE TABLE milestones (
    id INT PRIMARY KEY,
    name VARCHAR(100),
    description TEXT,
    start_date DATE,
    end_date DATE
  );

  -- SUBMISSIONS
  CREATE TABLE submissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    team_id INT,
    milestone_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES teams(id),
    FOREIGN KEY (milestone_id) REFERENCES milestones(id)
  );

  -- SUBMISSION VERSIONS
  CREATE TABLE submission_versions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    submission_id INT,
    file_path VARCHAR(255),
    version_number INT,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('pending','approved','rejected'),
    FOREIGN KEY (submission_id) REFERENCES submissions(id)
  );

  -- FEEDBACKS
  CREATE TABLE feedbacks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    submission_version_id INT,
    supervisor_id INT,
    content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (submission_version_id) REFERENCES submission_versions(id),
    FOREIGN KEY (supervisor_id) REFERENCES users(id)
  );

  -- TOPICS
  CREATE TABLE topics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    team_id INT,
    title VARCHAR(255),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES teams(id)
  );

  -- TOPIC STATUS
  CREATE TABLE topic_status (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50)
  );

  -- TOPIC REVIEWS
  CREATE TABLE topic_reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    topic_id INT,
    supervisor_id INT,
    status_id INT,
    reason TEXT,
    reviewed_at TIMESTAMP,
    FOREIGN KEY (topic_id) REFERENCES topics(id),
    FOREIGN KEY (supervisor_id) REFERENCES users(id),
    FOREIGN KEY (status_id) REFERENCES topic_status(id)
  );

  -- CHAT
  CREATE TABLE conversations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE conversation_members (
    conversation_id INT,
    user_id INT,
    PRIMARY KEY (conversation_id, user_id),
    FOREIGN KEY (conversation_id) REFERENCES conversations(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conversation_id INT,
    sender_id INT,
    content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id),
    FOREIGN KEY (sender_id) REFERENCES users(id)
  );

  -- NOTIFICATIONS
  CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    type VARCHAR(50),
    title VARCHAR(255),
    message TEXT,
    is_read TINYINT(1),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  -- SYSTEM LOGS
  CREATE TABLE system_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action VARCHAR(255),
    ip_address VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  -- AI SUMMARIES
  CREATE TABLE ai_summaries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    entity_type ENUM('submission','feedback','topic'),
    entity_id INT,
    summary TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  -- RISK
  CREATE TABLE risk_levels (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50)
  );

  CREATE TABLE risk_flags (
    id INT AUTO_INCREMENT PRIMARY KEY,
    team_id INT,
    risk_level_id INT,
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES teams(id),
    FOREIGN KEY (risk_level_id) REFERENCES risk_levels(id)
  );

  -- TECHNOLOGIES
  CREATE TABLE technologies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100)
  );

  CREATE TABLE topic_technologies (
    topic_id INT,
    tech_id INT,
    PRIMARY KEY (topic_id, tech_id),
    FOREIGN KEY (topic_id) REFERENCES topics(id),
    FOREIGN KEY (tech_id) REFERENCES technologies(id)
  );
  `;

  await conn.query(sql);

  console.log("🔥 DONE: Full database created giống ERD 100%");
  await conn.end();
}

run().catch(console.error);