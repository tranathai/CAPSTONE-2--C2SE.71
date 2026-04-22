import "dotenv/config";
import bcrypt from "bcryptjs";
import mysql from "mysql2/promise";

function randomPick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function run() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "mentor_ai_grad",
  });

  const passwordHash = await bcrypt.hash("Password@123", 10);
  const [roleRows] = await db.query("SELECT id, name FROM roles");
  const roleMap = new Map(roleRows.map((r) => [r.name, r.id]));
  const [teamColRows] = await db.query("SHOW COLUMNS FROM teams");
  const teamCols = new Set(teamColRows.map((r) => r.Field));
  const hasInviteCode = teamCols.has("invite_code");
  const hasCreatedBy = teamCols.has("created_by");
  const [userColRows] = await db.query("SHOW COLUMNS FROM users");
  const userCols = new Set(userColRows.map((r) => r.Field));
  const nameCol = userCols.has("full_name")
    ? "full_name"
    : userCols.has("name")
      ? "name"
      : null;
  const passwordCol = userCols.has("password_hash")
    ? "password_hash"
    : userCols.has("password")
      ? "password"
      : null;
  const hasStatus = userCols.has("status");
  if (!nameCol || !passwordCol) {
    throw new Error("users table missing compatible name/password columns");
  }
  const [submissionColRows] = await db.query("SHOW COLUMNS FROM submissions");
  const submissionCols = new Set(submissionColRows.map((r) => r.Field));
  const hasSubmissionTitle = submissionCols.has("title");
  const hasSubmissionStatus = submissionCols.has("status");
  const [versionColRows] = await db.query("SHOW COLUMNS FROM submission_versions");
  const versionCols = new Set(versionColRows.map((r) => r.Field));
  const hasVersionIsLate = versionCols.has("is_late");
  const versionTimeCol = versionCols.has("created_at")
    ? "created_at"
    : versionCols.has("submitted_at")
      ? "submitted_at"
      : null;

  const teams = [];
  for (let i = 1; i <= 20; i += 1) {
    const teamName = `Team ${i.toString().padStart(2, "0")}`;
    await db.query(
      `INSERT INTO teams (name${hasInviteCode ? ", invite_code" : ""}${hasCreatedBy ? ", created_by" : ""})
        VALUES (?${hasInviteCode ? ", ?" : ""}${hasCreatedBy ? ", 1" : ""})
        ON DUPLICATE KEY UPDATE name = VALUES(name)`,
      [teamName, ...(hasInviteCode ? [`TEAM${1000 + i}`] : [])],
    );
  }
  const [teamRows] = await db.query("SELECT id FROM teams ORDER BY id ASC");
  teamRows.forEach((t) => teams.push(t.id));

  const studentRoleId = roleMap.get("student") || 1;
  const supervisorRoleId = roleMap.get("supervisor") || 2;

  for (let i = 1; i <= 120; i += 1) {
    const email = `student${i}@example.com`;
    await db.query(
      `INSERT INTO users (${nameCol}, email, ${passwordCol}, role_id${hasStatus ? ", status" : ""})
        VALUES (?, ?, ?, ?${hasStatus ? ", 'active'" : ""})
        ON DUPLICATE KEY UPDATE ${nameCol} = VALUES(${nameCol}), role_id = VALUES(role_id)`,
      [`Student ${i}`, email, passwordHash, studentRoleId],
    );
  }
  for (let i = 1; i <= 18; i += 1) {
    const email = `supervisor${i}@example.com`;
    await db.query(
      `INSERT INTO users (${nameCol}, email, ${passwordCol}, role_id${hasStatus ? ", status" : ""})
        VALUES (?, ?, ?, ?${hasStatus ? ", 'active'" : ""})
        ON DUPLICATE KEY UPDATE ${nameCol} = VALUES(${nameCol}), role_id = VALUES(role_id)`,
      [`Supervisor ${i}`, email, passwordHash, supervisorRoleId],
    );
  }

  const [studentRows] = await db.query(
    "SELECT id FROM users WHERE role_id = ? ORDER BY id ASC LIMIT 120",
    [studentRoleId],
  );
  for (const student of studentRows) {
    const teamId = randomPick(teams);
    await db.query(
      `INSERT INTO team_members (team_id, user_id, is_leader)
        VALUES (?, ?, 0)
        ON DUPLICATE KEY UPDATE joined_at = joined_at`,
      [teamId, student.id],
    );
  }

  const [milestones] = await db.query("SELECT id FROM milestones ORDER BY id ASC");
  for (const teamId of teams) {
    for (const milestone of milestones) {
      const title = `Submission Team ${teamId} - M${milestone.id}`;
      const [sub] = await db.query(
        `INSERT INTO submissions (team_id, milestone_id${hasSubmissionTitle ? ", title" : ""}${hasSubmissionStatus ? ", status" : ""})
          VALUES (?, ?${hasSubmissionTitle ? ", ?" : ""}${hasSubmissionStatus ? ", 'Pending Review'" : ""})`,
        [teamId, milestone.id, ...(hasSubmissionTitle ? [title] : [])],
      );
      const submissionId = sub.insertId;
      for (let v = 1; v <= 3; v += 1) {
        await db.query(
          `INSERT INTO submission_versions
            (submission_id, version_number, file_path${hasVersionIsLate ? ", is_late" : ""}${versionTimeCol ? `, ${versionTimeCol}` : ""})
            VALUES (?, ?, ?${hasVersionIsLate ? ", ?" : ""}${versionTimeCol ? ", NOW()" : ""})`,
          [
            submissionId,
            v,
            `/uploads/reports/team-${teamId}-m-${milestone.id}-v-${v}.pdf`,
            ...(hasVersionIsLate ? [v === 3 ? 1 : 0] : []),
          ],
        );
      }
    }
  }

  await db.end();
  console.log("Large seed completed.");
}

run().catch((error) => {
  console.error("Large seed failed:", error.message);
  process.exit(1);
});
