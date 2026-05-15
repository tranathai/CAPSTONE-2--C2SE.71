/** Latest submission version id from GET /submissions/:id payload. */
export function resolveSubmissionVersionId(submission) {
  if (!submission) return null;
  const direct = submission.version_id ?? submission.submission_version_id;
  if (direct != null && direct !== "") {
    const n = Number(direct);
    return Number.isFinite(n) && n > 0 ? n : null;
  }
  const versions = submission.versions;
  if (Array.isArray(versions) && versions.length > 0) {
    const latest = versions.reduce((best, v) =>
      Number(v.version_number) > Number(best.version_number) ? v : best,
    versions[0]);
    const n = Number(latest.id);
    return Number.isFinite(n) && n > 0 ? n : null;
  }
  return null;
}
