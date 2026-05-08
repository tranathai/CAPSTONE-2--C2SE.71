import pool from "../config/db.js";

/* ================= GET ALL GROUPS ================= */

export async function getAllGroups() {
  const [rows] = await pool.query(`
    SELECT
      t.id,
      t.name,
      t.supervisor_id,

      MAX(mentor.name) AS mentor_name,

      MAX(tp.title) AS topic_title,

      MAX(
        CASE
          WHEN tm.is_leader = 1 THEN u.name
        END
      ) AS leader_name,

      COUNT(DISTINCT tm.user_id) AS total_members,

      GROUP_CONCAT(
        DISTINCT u.name
        SEPARATOR ', '
      ) AS members,

      GROUP_CONCAT(
        DISTINCT u.email
        SEPARATOR ', '
      ) AS member_emails

    FROM teams t

    LEFT JOIN users mentor
      ON mentor.id = t.supervisor_id

    LEFT JOIN team_members tm
      ON tm.team_id = t.id

    LEFT JOIN users u
      ON u.id = tm.user_id

    LEFT JOIN topics tp
      ON tp.team_id = t.id

    GROUP BY
      t.id,
      t.name,
      t.supervisor_id

    ORDER BY t.id DESC
  `);

  return rows.map((row) => ({
    ...row,

    members: row.members
      ? row.members.split(", ")
      : [],

    member_emails: row.member_emails
      ? row.member_emails.split(", ")
      : [],
  }));
}

/* ================= GET ALL STUDENTS ================= */

export async function getAllStudents() {
  const [rows] = await pool.query(`
    SELECT
      id,
      name,
      email
    FROM users
    WHERE role_id = 1
    ORDER BY name ASC
  `);

  return rows;
}

/* ================= GET ALL MENTORS ================= */

export async function getAllMentors() {
  const [rows] = await pool.query(`
    SELECT
      id,
      name
    FROM users
    WHERE role_id = 2
    ORDER BY name ASC
  `);

  return rows;
}

/* ================= CREATE GROUP ================= */

export async function createGroup({
  name,
  supervisor_id,
  topic_title,
  studentIds,
}) {
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    /* NEW TEAM ID */
    const [max] = await conn.query(`
      SELECT MAX(id) as maxId
      FROM teams
    `);

    const newId = (max[0].maxId || 0) + 1;

    /* CREATE TEAM */
    await conn.query(
      `
      INSERT INTO teams
      (
        id,
        name,
        supervisor_id
      )
      VALUES (?, ?, ?)
    `,
      [newId, name, supervisor_id || null]
    );

    /* CREATE TOPIC */
    if (topic_title) {
      await conn.query(
        `
        INSERT INTO topics
        (
          team_id,
          title
        )
        VALUES (?, ?)
      `,
        [newId, topic_title]
      );
    }

    /* CREATE MEMBERS */
    if (studentIds?.length > 0) {
      const values = studentIds.map(
        (studentId, index) => [
          newId,
          studentId,
          index === 0 ? 1 : 0,
        ]
      );

      await conn.query(
        `
        INSERT INTO team_members
        (
          team_id,
          user_id,
          is_leader
        )
        VALUES ?
      `,
        [values]
      );
    }

    await conn.commit();

    return newId;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

/* ================= UPDATE GROUP ================= */

export async function updateGroup(
  teamId,
  {
    name,
    supervisor_id,
    topic_title,
    studentIds,
  }
) {
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    /* UPDATE TEAM */
    await conn.query(
      `
      UPDATE teams
      SET
        name = ?,
        supervisor_id = ?
      WHERE id = ?
    `,
      [name, supervisor_id || null, teamId]
    );

    /* CHECK TOPIC */
    const [topicRows] = await conn.query(
      `
      SELECT id
      FROM topics
      WHERE team_id = ?
    `,
      [teamId]
    );

    /* UPDATE TOPIC */
    if (topicRows.length > 0) {
      await conn.query(
        `
        UPDATE topics
        SET title = ?
        WHERE team_id = ?
      `,
        [topic_title || null, teamId]
      );
    } else if (topic_title) {
      await conn.query(
        `
        INSERT INTO topics
        (
          team_id,
          title
        )
        VALUES (?, ?)
      `,
        [teamId, topic_title]
      );
    }

    /* DELETE OLD MEMBERS */
    await conn.query(
      `
      DELETE FROM team_members
      WHERE team_id = ?
    `,
      [teamId]
    );

    /* INSERT NEW MEMBERS */
    if (studentIds?.length > 0) {
      const values = studentIds.map(
        (studentId, index) => [
          teamId,
          studentId,
          index === 0 ? 1 : 0,
        ]
      );

      await conn.query(
        `
        INSERT INTO team_members
        (
          team_id,
          user_id,
          is_leader
        )
        VALUES ?
      `,
        [values]
      );
    }

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

/* ================= DELETE GROUP ================= */

export async function deleteGroup(teamId) {
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    /* GET SUBMISSIONS */
    const [subs] = await conn.query(
      `
      SELECT id
      FROM submissions
      WHERE team_id = ?
    `,
      [teamId]
    );

    const submissionIds = subs.map(
      (s) => s.id
    );

    /* DELETE FEEDBACK + VERSION + SUBMISSION */
    if (submissionIds.length > 0) {
      await conn.query(
        `
        DELETE FROM feedbacks
        WHERE submission_version_id IN (
          SELECT id
          FROM submission_versions
          WHERE submission_id IN (?)
        )
      `,
        [submissionIds]
      );

      await conn.query(
        `
        DELETE FROM submission_versions
        WHERE submission_id IN (?)
      `,
        [submissionIds]
      );

      await conn.query(
        `
        DELETE FROM submissions
        WHERE team_id = ?
      `,
        [teamId]
      );
    }

    /* DELETE TOPIC */
    await conn.query(
      `
      DELETE FROM topics
      WHERE team_id = ?
    `,
      [teamId]
    );

    /* DELETE RISK */
    await conn.query(
      `
      DELETE FROM risk_flags
      WHERE team_id = ?
    `,
      [teamId]
    );

    /* DELETE MEMBERS */
    await conn.query(
      `
      DELETE FROM team_members
      WHERE team_id = ?
    `,
      [teamId]
    );

    /* DELETE TEAM */
    await conn.query(
      `
      DELETE FROM teams
      WHERE id = ?
    `,
      [teamId]
    );

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}