import pool from "../config/db.js";

let submissionColumnMetaPromise;
let userColumnMetaPromise;
let submissionVersionColumnMetaPromise;

async function getSubmissionColumnMeta() {
  if (!submissionColumnMetaPromise) {
    submissionColumnMetaPromise = pool
      .query("SHOW COLUMNS FROM submissions")
      .then(([rows]) => {
        const names = new Set(rows.map((row) => row.Field));
        return {
          hasTitle: names.has("title"),
          hasMilestoneId: names.has("milestone_id"),
        };
      })
      .catch((error) => {
        submissionColumnMetaPromise = null;
        throw error;
      });
  }
  return submissionColumnMetaPromise;
}

async function getUserColumnMeta() {
  if (!userColumnMetaPromise) {
    userColumnMetaPromise = pool
      .query("SHOW COLUMNS FROM users")
      .then(([rows]) => {
        const names = new Set(rows.map((row) => row.Field));
        return {
          hasFullName: names.has("full_name"),
          hasName: names.has("name"),
        };
      })
      .catch((error) => {
        userColumnMetaPromise = null;
        throw error;
      });
  }
  return userColumnMetaPromise;
}

async function getSubmissionVersionColumnMeta() {
  if (!submissionVersionColumnMetaPromise) {
    submissionVersionColumnMetaPromise = pool
      .query("SHOW COLUMNS FROM submission_versions")
      .then(([rows]) => {
        const names = new Set(rows.map((row) => row.Field));
        return {
          hasCreatedAt: names.has("created_at"),
        };
      })
      .catch((error) => {
        submissionVersionColumnMetaPromise = null;
        throw error;
      });
  }
  return submissionVersionColumnMetaPromise;
}

export async function findSubmissionReviewById(submissionId) {
  const { hasTitle, hasMilestoneId } = await getSubmissionColumnMeta();
  const { hasFullName, hasName } = await getUserColumnMeta();
  const { hasCreatedAt } = await getSubmissionVersionColumnMeta();
  const studentNameSelect = hasFullName
    ? "u.full_name AS student_name,"
    : hasName
      ? "u.name AS student_name,"
      : "CONCAT('Student #', tm.user_id) AS student_name,";
  const sql = `
    SELECT
      s.id AS submission_id,
      ${
        hasTitle
          ? "s.title AS submission_title,"
          : "CONCAT('Submission #', s.id) AS submission_title,"
      }
      s.team_id,
      sv.id AS submission_version_id,
      sv.file_path,
      sv.version_number,
      t.name AS team_name,
      ${studentNameSelect}
      ${hasMilestoneId ? "m.name AS milestone_name" : "NULL AS milestone_name"}
    FROM submissions s
    INNER JOIN teams t
      ON t.id = s.team_id
    INNER JOIN submission_versions sv
      ON sv.submission_id = s.id
    LEFT JOIN team_members tm
      ON tm.team_id = t.id AND tm.is_leader = 1
    LEFT JOIN users u
      ON u.id = tm.user_id
    ${
      hasMilestoneId
        ? `LEFT JOIN milestones m
      ON m.id = s.milestone_id`
        : ""
    }
    WHERE s.id = ?
    ORDER BY sv.version_number DESC${hasCreatedAt ? ", sv.created_at DESC" : ""}
    LIMIT 1
  `;

  const [rows] = await pool.query(sql, [submissionId]);
  return rows[0] || null;
}

export async function findAllSubmissions({ teamId } = {}) {
  const { hasTitle, hasMilestoneId } = await getSubmissionColumnMeta();
  const { hasFullName, hasName } = await getUserColumnMeta();
  const { hasCreatedAt } = await getSubmissionVersionColumnMeta();
  const studentNameSelect = hasFullName
    ? "u.full_name AS student_name"
    : hasName
      ? "u.name AS student_name"
      : "CONCAT('Student #', tm.user_id) AS student_name";
  let sql = `
    SELECT
      s.id,
      ${hasTitle ? "s.title," : "CONCAT('Submission #', s.id) AS title,"}
      s.team_id,
      ${hasMilestoneId ? "s.milestone_id," : "NULL AS milestone_id,"}
      t.name AS team_name,
      ${hasMilestoneId ? "m.name AS milestone_name," : "NULL AS milestone_name,"}
      sv.id AS submission_version_id,
      sv.file_path,
      sv.version_number,
      ${studentNameSelect},
      CASE
        WHEN EXISTS (
          SELECT 1
          FROM feedbacks f
          WHERE f.submission_version_id = sv.id
          LIMIT 1
        ) THEN 'Reviewed'
        ELSE 'Pending Review'
      END AS status_label
    FROM submissions s
    INNER JOIN teams t
      ON t.id = s.team_id
    INNER JOIN submission_versions sv
      ON sv.id = (
        SELECT sv2.id
        FROM submission_versions sv2
        WHERE sv2.submission_id = s.id
        ORDER BY sv2.version_number DESC${hasCreatedAt ? ", sv2.created_at DESC" : ""}
        LIMIT 1
      )
    ${
      hasMilestoneId
        ? `LEFT JOIN milestones m
      ON m.id = s.milestone_id`
        : ""
    }
    LEFT JOIN team_members tm
      ON tm.team_id = t.id AND tm.is_leader = 1
    LEFT JOIN users u
      ON u.id = tm.user_id
  `;
  const params = [];
  if (teamId != null && Number.isInteger(teamId) && teamId > 0) {
    sql += ` WHERE s.team_id = ?`;
    params.push(teamId);
  }
  sql += ` ORDER BY s.id DESC`;

  const [rows] = await pool.query(sql, params);
  return rows;
}

export async function createSubmissionWithVersion({
  teamId,
  milestoneId,
  title,
  filePath,
}) {
  const { hasTitle, hasMilestoneId } = await getSubmissionColumnMeta();
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    let subResult;
    if (hasTitle && hasMilestoneId) {
      [subResult] = await connection.query(
        `INSERT INTO submissions (team_id, milestone_id, title) VALUES (?, ?, ?)`,
        [teamId, milestoneId ?? null, title],
      );
    } else if (hasMilestoneId) {
      [subResult] = await connection.query(
        `INSERT INTO submissions (team_id, milestone_id) VALUES (?, ?)`,
        [teamId, milestoneId ?? null],
      );
    } else if (hasTitle) {
      [subResult] = await connection.query(
        `INSERT INTO submissions (team_id, title) VALUES (?, ?)`,
        [teamId, title],
      );
    } else {
      [subResult] = await connection.query(
        `INSERT INTO submissions (team_id) VALUES (?)`,
        [teamId],
      );
    }
    const submissionId = subResult.insertId;

    const [verRows] = await connection.query(
      `SELECT COALESCE(MAX(version_number), 0) AS maxv
       FROM submission_versions WHERE submission_id = ?`,
      [submissionId],
    );
    const nextVersion = (verRows[0]?.maxv ?? 0) + 1;

    const [verResult] = await connection.query(
      `INSERT INTO submission_versions (submission_id, version_number, file_path)
       VALUES (?, ?, ?)`,
      [submissionId, nextVersion, filePath],
    );

    await connection.commit();
    return {
      submissionId,
      submissionVersionId: verResult.insertId,
      versionNumber: nextVersion,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
