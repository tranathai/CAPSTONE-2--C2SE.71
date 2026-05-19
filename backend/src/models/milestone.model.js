import pool from "../config/db.js";

function parseRequiredDocuments(raw) {
  if (raw == null || raw === "") return [];
  if (Array.isArray(raw)) return raw.filter(Boolean);
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v.map(String).filter(Boolean) : [];
  } catch {
    return [];
  }
}

function mapMilestoneRow(r) {
  if (!r) return r;
  return { ...r, required_documents: parseRequiredDocuments(r.required_documents) };
}

export async function findAllMilestones({ graduationBatchId } = {}) {
  let sql = `SELECT m.id, m.name, m.description, m.start_date, m.end_date, m.deadline_type, m.display_order, m.required_documents,
            m.created_at, m.graduation_batch_id, gb.name AS graduation_batch_name
     FROM milestones m
     LEFT JOIN graduation_batches gb ON gb.id = m.graduation_batch_id`;
  const params = [];
  if (graduationBatchId) {
    sql += " WHERE m.graduation_batch_id = ?";
    params.push(graduationBatchId);
  }
  sql += " ORDER BY m.display_order ASC, m.id ASC";
  const [rows] = await pool.query(sql, params);
  return rows.map(mapMilestoneRow);
}

export async function findAllGraduationBatches() {
  const [rows] = await pool.query(
    `SELECT id, name, description, start_date, end_date, created_at, updated_at
     FROM graduation_batches ORDER BY id DESC`,
  );
  return rows;
}

export async function findGraduationBatchById(id) {
  const [rows] = await pool.query(
    `SELECT id, name, description, start_date, end_date, created_at, updated_at
     FROM graduation_batches WHERE id = ?`,
    [id],
  );
  return rows[0] || null;
}

/** Trùng tên đợt: không phân biệt hoa thường, trim. excludeId: khi cập nhật đợt. */
export async function findGraduationBatchIdByNormalizedName(trimmedName, { excludeId } = {}) {
  const key = String(trimmedName || "").trim();
  if (!key) return null;
  let sql = `SELECT id FROM graduation_batches WHERE LOWER(TRIM(name)) = LOWER(?)`;
  const params = [key];
  if (excludeId) {
    sql += ` AND id <> ?`;
    params.push(excludeId);
  }
  sql += ` LIMIT 1`;
  const [rows] = await pool.query(sql, params);
  return rows[0]?.id ?? null;
}

export async function createGraduationBatch({ name, description, startDate, endDate }) {
  const [result] = await pool.query(
    `INSERT INTO graduation_batches (name, description, start_date, end_date)
     VALUES (?, ?, ?, ?)`,
    [name, description || null, startDate || null, endDate || null],
  );
  return result.insertId;
}

export async function updateGraduationBatch(id, { name, description, startDate, endDate }) {
  await pool.query(
    `UPDATE graduation_batches SET
       name = COALESCE(?, name),
       description = COALESCE(?, description),
       start_date = COALESCE(?, start_date),
       end_date = COALESCE(?, end_date)
     WHERE id = ?`,
    [name, description, startDate, endDate, id],
  );
}

export async function deleteGraduationBatch(id) {
  await pool.query(`DELETE FROM graduation_batches WHERE id = ?`, [id]);
}

export async function findDefaultGraduationBatchId() {
  const [rows] = await pool.query(
    `SELECT id FROM graduation_batches ORDER BY id ASC LIMIT 1`,
  );
  return rows[0]?.id || null;
}

/** Mốc Final = thứ tự hiển thị lớn nhất (admin quản lý trong trang Milestones). */
export async function findFinalMilestone() {
  const [rows] = await pool.query(
    `SELECT id, name, description, start_date, end_date, deadline_type, display_order, required_documents, graduation_batch_id
     FROM milestones ORDER BY display_order DESC, id DESC LIMIT 1`,
  );
  return rows[0] ? mapMilestoneRow(rows[0]) : null;
}

export async function findMilestoneById(id) {
  const [rows] = await pool.query(
    `SELECT id, name, description, start_date, end_date, deadline_type, display_order, required_documents, graduation_batch_id
     FROM milestones WHERE id = ?`,
    [id],
  );
  return rows[0] ? mapMilestoneRow(rows[0]) : null;
}

export async function createMilestone({
  name,
  description,
  startDate,
  endDate,
  deadlineType,
  displayOrder,
  requiredDocuments,
  graduationBatchId,
}) {
  const docsJson =
    requiredDocuments != null ? JSON.stringify(Array.isArray(requiredDocuments) ? requiredDocuments : []) : null;
  const [result] = await pool.query(
    `INSERT INTO milestones (name, description, start_date, end_date, deadline_type, display_order, required_documents, graduation_batch_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [name, description || null, startDate, endDate, deadlineType || "soft", displayOrder || 0, docsJson, graduationBatchId || null],
  );
  return result.insertId;
}

/**
 * Đổi thứ tự hiển thị; nếu đã có mốc khác cùng đợt dùng số thứ tự đó thì hoán đổi (vd. 2 ↔ 3).
 * @returns {{ swapped: boolean, swappedWith: { id: number, name: string } | null }}
 */
export async function applyMilestoneDisplayOrderSwap(milestoneId, newOrder, graduationBatchId) {
  const existing = await findMilestoneById(milestoneId);
  if (!existing) return { swapped: false, swappedWith: null };

  const target = Number(newOrder);
  const current = Number(existing.display_order ?? 0);
  if (!Number.isFinite(target) || target < 0) {
    return { swapped: false, swappedWith: null };
  }
  if (target === current) {
    return { swapped: false, swappedWith: null };
  }

  const batchId = graduationBatchId ?? existing.graduation_batch_id ?? null;
  let peerSql = `SELECT m.id, m.name FROM milestones m
     WHERE m.id <> ? AND m.display_order = ?`;
  const peerParams = [milestoneId, target];
  if (batchId != null && batchId !== "") {
    peerSql += ` AND m.graduation_batch_id = ?`;
    peerParams.push(batchId);
  } else {
    peerSql += ` AND m.graduation_batch_id IS NULL`;
  }
  peerSql += ` ORDER BY m.id ASC LIMIT 1`;

  const [peers] = await pool.query(peerSql, peerParams);
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    let swappedWith = null;
    if (peers.length > 0) {
      swappedWith = { id: peers[0].id, name: peers[0].name };
      await connection.query(`UPDATE milestones SET display_order = ? WHERE id = ?`, [current, peers[0].id]);
    }
    await connection.query(`UPDATE milestones SET display_order = ? WHERE id = ?`, [target, milestoneId]);
    await connection.commit();
    return { swapped: peers.length > 0, swappedWith };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

export async function updateMilestone(id, { name, description, startDate, endDate, deadlineType, displayOrder, requiredDocuments, graduationBatchId }) {
  let docsJson = undefined;
  if (requiredDocuments !== undefined) {
    docsJson = JSON.stringify(Array.isArray(requiredDocuments) ? requiredDocuments : []);
  }
  await pool.query(
    `UPDATE milestones SET
       name = COALESCE(?, name),
       description = COALESCE(?, description),
       start_date = COALESCE(?, start_date),
       end_date = COALESCE(?, end_date),
       deadline_type = COALESCE(?, deadline_type),
       display_order = COALESCE(?, display_order),
       required_documents = COALESCE(?, required_documents),
       graduation_batch_id = COALESCE(?, graduation_batch_id)
     WHERE id = ?`,
    [name, description, startDate, endDate, deadlineType, displayOrder, docsJson, graduationBatchId, id],
  );
}

export async function deleteMilestone(id) {
  await pool.query(`DELETE FROM milestones WHERE id = ?`, [id]);
}

export async function findUpcomingMilestones(limit = 5) {
  const [rows] = await pool.query(
    `SELECT id, name, end_date FROM milestones
     WHERE end_date >= NOW()
     ORDER BY end_date ASC LIMIT ?`,
    [limit],
  );
  return rows;
}
