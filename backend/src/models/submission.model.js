import pool from "../config/db.js";

/** mysql2 có thể trả MAX(...) dạng chuỗi — tránh "1" + 1 => "11" trong JS */
function bumpVersion(maxv) {
  const n = Number(maxv);
  return (Number.isFinite(n) ? n : 0) + 1;
}

export async function findAllSubmissions({ teamId, milestoneId } = {}) {
  let sql = `
    SELECT s.id, s.team_id, s.milestone_id, s.title, s.status_label, s.submitted_at,
           t.name AS team_name,
           m.name AS milestone_name, m.end_date AS milestone_deadline,
           sv.id AS version_id, sv.file_path, sv.version_number,
           u.full_name AS submitter_name,
           EXISTS(SELECT 1 FROM feedbacks f WHERE f.submission_version_id = sv.id AND f.is_final = 1) AS has_final_feedback
    FROM submissions s
    INNER JOIN teams t ON t.id = s.team_id
    LEFT JOIN milestones m ON m.id = s.milestone_id
    INNER JOIN submission_versions sv ON sv.id = (
      SELECT sv2.id FROM submission_versions sv2 WHERE sv2.submission_id = s.id
      ORDER BY sv2.version_number DESC LIMIT 1
    )
    LEFT JOIN team_members tm ON tm.team_id = t.id AND tm.is_leader = 1
    LEFT JOIN users u ON u.id = tm.user_id
    WHERE 1=1`;
  const params = [];
  if (teamId) { sql += ` AND s.team_id = ?`; params.push(teamId); }
  if (milestoneId) { sql += ` AND s.milestone_id = ?`; params.push(milestoneId); }
  sql += ` ORDER BY s.id DESC`;

  const [rows] = await pool.query(sql, params);
  return rows;
}

export async function findSubmissionById(id) {
  const [rows] = await pool.query(
    `SELECT s.id, s.team_id, s.milestone_id, s.title, s.status_label, s.submitted_at,
            t.name AS team_name,
            m.name AS milestone_name, m.end_date AS milestone_deadline,
            sv.id AS version_id, sv.file_path, sv.version_number, sv.original_filename, sv.file_size,
            sv.submitted_at AS version_submitted_at, sv.is_late
     FROM submissions s
     INNER JOIN teams t ON t.id = s.team_id
     LEFT JOIN milestones m ON m.id = s.milestone_id
     INNER JOIN submission_versions sv ON sv.id = (
       SELECT sv2.id FROM submission_versions sv2 WHERE sv2.submission_id = s.id
       ORDER BY sv2.version_number DESC LIMIT 1
     )
     WHERE s.id = ?`,
    [id],
  );
  return rows[0] || null;
}

export async function findSubmissionVersions(submissionId) {
  const [rows] = await pool.query(
    `SELECT sv.id, sv.version_number, sv.file_path, sv.original_filename, sv.file_size,
            sv.submitted_at, sv.is_late,
            (SELECT COUNT(*) FROM feedbacks WHERE submission_version_id = sv.id) AS feedback_count
     FROM submission_versions sv
     WHERE sv.submission_id = ?
     ORDER BY sv.version_number DESC`,
    [submissionId],
  );
  return rows;
}

export async function createSubmission({ teamId, milestoneId, title, filePath, originalFilename, fileSize }) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [subResult] = await connection.query(
      `INSERT INTO submissions (team_id, milestone_id, title, submitted_at) VALUES (?, ?, ?, NOW())`,
      [teamId, milestoneId || null, title],
    );
    const submissionId = subResult.insertId;

    const [verResult] = await connection.query(
      `SELECT COALESCE(MAX(version_number), 0) AS maxv FROM submission_versions WHERE submission_id = ?`,
      [submissionId],
    );
    const nextVersion = bumpVersion(verResult[0]?.maxv);

    let isLate = 0;
    if (milestoneId) {
      const [milRows] = await connection.query(
        `SELECT end_date FROM milestones WHERE id = ?`,
        [milestoneId],
      );
      if (milRows[0] && new Date() > new Date(milRows[0].end_date)) {
        isLate = 1;
      }
    }

    const [versionResult] = await connection.query(
      `INSERT INTO submission_versions (submission_id, version_number, file_path, original_filename, file_size, submitted_at, is_late)
       VALUES (?, ?, ?, ?, ?, NOW(), ?)`,
      [submissionId, nextVersion, filePath, originalFilename || null, fileSize || null, isLate],
    );

    await connection.commit();
    return { submissionId, versionId: versionResult.insertId, versionNumber: nextVersion, isLate };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

export async function findStudentSubmissionHistory(teamId, { sinceDate } = {}) {
  let sql = `SELECT s.id, s.title, s.submitted_at, s.status_label,
            m.name AS milestone_name, m.end_date AS milestone_deadline,
            sv.id AS version_id, sv.version_number, sv.file_path, sv.is_late,
            EXISTS(SELECT 1 FROM feedbacks f WHERE f.submission_version_id = sv.id) AS has_feedback,
            EXISTS(SELECT 1 FROM feedbacks f WHERE f.submission_version_id = sv.id AND f.is_final = 1) AS has_final_feedback
     FROM submissions s
     LEFT JOIN milestones m ON m.id = s.milestone_id
     INNER JOIN submission_versions sv ON sv.id = (
       SELECT sv2.id FROM submission_versions sv2 WHERE sv2.submission_id = s.id
       ORDER BY sv2.version_number DESC LIMIT 1
     )
     WHERE s.team_id = ?`;
  const params = [teamId];
  if (sinceDate) {
    sql += " AND s.submitted_at >= ?";
    params.push(sinceDate);
  }
  sql += " ORDER BY s.submitted_at DESC";

  const [rows] = await pool.query(sql, params);
  return rows;
}

export async function findSupervisorSubmissions(supervisorId) {
  const [rows] = await pool.query(
    `SELECT s.id, s.title, s.submitted_at, s.status_label,
            t.id AS team_id, t.name AS team_name,
            m.name AS milestone_name,
            sv.id AS version_id, sv.file_path, sv.is_late,
            EXISTS(SELECT 1 FROM feedbacks f WHERE f.submission_version_id = sv.id) AS has_feedback
     FROM submissions s
     INNER JOIN teams t ON t.id = s.team_id
     INNER JOIN topic_registrations tr ON tr.team_id = t.id AND tr.status = 'approved'
     LEFT JOIN milestones m ON m.id = s.milestone_id
     INNER JOIN submission_versions sv ON sv.id = (
       SELECT sv2.id FROM submission_versions sv2 WHERE sv2.submission_id = s.id
       ORDER BY sv2.version_number DESC LIMIT 1
     )
     WHERE tr.supervisor_id = ?
     ORDER BY s.submitted_at DESC`,
    [supervisorId],
  );
  return rows;
}

export async function createStudentSubmission({ teamId, milestoneId, title, filePath, originalFilename, fileSize, userId }) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Check if user is team member
    const [memberRows] = await connection.query(
      `SELECT 1 FROM team_members WHERE team_id = ? AND user_id = ?`,
      [teamId, userId],
    );
    if (memberRows.length === 0) {
      throw new Error("Bạn không phải thành viên của nhóm này");
    }

    // Check if milestone exists and is active
    if (milestoneId) {
      const [milRows] = await connection.query(
        `SELECT id, end_date FROM milestones WHERE id = ?`,
        [milestoneId],
      );
      if (milRows.length === 0) {
        throw new Error("Cột mốc không tồn tại");
      }
    }

    const [subResult] = await connection.query(
      `INSERT INTO submissions (team_id, milestone_id, title, submitted_at) VALUES (?, ?, ?, NOW())`,
      [teamId, milestoneId || null, title],
    );
    const submissionId = subResult.insertId;

    const [verResult] = await connection.query(
      `SELECT COALESCE(MAX(version_number), 0) AS maxv FROM submission_versions WHERE submission_id = ?`,
      [submissionId],
    );
    const nextVersion = bumpVersion(verResult[0]?.maxv);

    let isLate = 0;
    if (milestoneId) {
      const [milRows] = await connection.query(
        `SELECT end_date FROM milestones WHERE id = ?`,
        [milestoneId],
      );
      if (milRows[0] && new Date() > new Date(milRows[0].end_date)) {
        isLate = 1;
      }
    }

    const [versionResult] = await connection.query(
      `INSERT INTO submission_versions (submission_id, version_number, file_path, original_filename, file_size, submitted_at, is_late)
       VALUES (?, ?, ?, ?, ?, NOW(), ?)`,
      [submissionId, nextVersion, filePath, originalFilename || null, fileSize || null, isLate],
    );

    await connection.commit();
    return { submissionId, versionId: versionResult.insertId, versionNumber: nextVersion, isLate };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

export async function addVersionToStudentSubmission({ submissionId, filePath, originalFilename, fileSize, userId }) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [subRows] = await connection.query(
      `SELECT s.id, s.team_id, s.milestone_id, s.title FROM submissions s WHERE s.id = ?`,
      [submissionId],
    );
    if (!subRows.length) throw new Error("Không tìm thấy bài nộp");

    const sub = subRows[0];

    const [memberRows] = await connection.query(
      `SELECT 1 FROM team_members WHERE team_id = ? AND user_id = ?`,
      [sub.team_id, userId],
    );
    if (memberRows.length === 0) {
      throw new Error("Bạn không có quyền cập nhật bài nộp này");
    }

    const [verResult] = await connection.query(
      `SELECT COALESCE(MAX(version_number), 0) AS maxv FROM submission_versions WHERE submission_id = ?`,
      [submissionId],
    );
    const nextVersion = bumpVersion(verResult[0]?.maxv);

    let isLate = 0;
    if (sub.milestone_id) {
      const [milRows] = await connection.query(`SELECT end_date FROM milestones WHERE id = ?`, [sub.milestone_id]);
      if (milRows[0] && new Date() > new Date(milRows[0].end_date)) {
        isLate = 1;
      }
    }

    const [versionResult] = await connection.query(
      `INSERT INTO submission_versions (submission_id, version_number, file_path, original_filename, file_size, submitted_at, is_late)
       VALUES (?, ?, ?, ?, ?, NOW(), ?)`,
      [submissionId, nextVersion, filePath, originalFilename || null, fileSize || null, isLate],
    );

    await connection.query(
      `UPDATE submissions SET status_label = 'Pending Review', updated_at = NOW() WHERE id = ?`,
      [submissionId],
    );

    await connection.commit();
    return {
      submissionId,
      versionId: versionResult.insertId,
      versionNumber: nextVersion,
      isLate,
      title: sub.title,
      teamId: sub.team_id,
    };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

export async function updateSubmissionTitle(submissionId, title, userId) {
  // Check if user is team member
  const [memberRows] = await pool.query(
    `SELECT 1 FROM team_members tm
     INNER JOIN submissions s ON s.team_id = tm.team_id
     WHERE s.id = ? AND tm.user_id = ?`,
    [submissionId, userId],
  );
  if (memberRows.length === 0) {
    throw new Error("Bạn không có quyền chỉnh sửa bài nộp này");
  }

  await pool.query(
    `UPDATE submissions SET title = ? WHERE id = ?`,
    [title, submissionId],
  );
}

export async function deleteSubmissionVersion(versionId, userId) {
  // Check if user is team member and this is not the only version
  const [versionRows] = await pool.query(
    `SELECT sv.submission_id, sv.version_number,
            (SELECT COUNT(*) FROM submission_versions WHERE submission_id = sv.submission_id) AS total_versions
     FROM submission_versions sv
     INNER JOIN submissions s ON s.id = sv.submission_id
     INNER JOIN team_members tm ON tm.team_id = s.team_id
     WHERE sv.id = ? AND tm.user_id = ?`,
    [versionId, userId],
  );

  if (versionRows.length === 0) {
    throw new Error("Bạn không có quyền xóa phiên bản này");
  }

  if (versionRows[0].total_versions <= 1) {
    throw new Error("Không thể xóa phiên bản cuối cùng");
  }

  // Delete the version
  await pool.query(`DELETE FROM submission_versions WHERE id = ?`, [versionId]);
}

export async function findSubmissionsByMilestone(teamId, milestoneId) {
  const [rows] = await pool.query(
    `SELECT s.id, s.title, s.submitted_at, s.status_label,
            sv.id AS version_id, sv.version_number, sv.file_path, sv.original_filename, sv.file_size,
            sv.submitted_at AS version_submitted_at, sv.is_late,
            (SELECT COUNT(*) FROM feedbacks WHERE submission_version_id = sv.id) AS feedback_count
     FROM submissions s
     INNER JOIN submission_versions sv ON sv.id = (
       SELECT sv2.id FROM submission_versions sv2 WHERE sv2.submission_id = s.id
       ORDER BY sv2.version_number DESC LIMIT 1
     )
     WHERE s.team_id = ? AND s.milestone_id = ?
     ORDER BY s.submitted_at DESC`,
    [teamId, milestoneId],
  );
  return rows;
}
