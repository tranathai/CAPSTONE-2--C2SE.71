-- Sample test data for MentorAI Grad backend
-- Run this script on MySQL after your schema has been created.

START TRANSACTION;

INSERT INTO roles (id, name)
VALUES
  (1, 'student'),
  (2, 'supervisor')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO users (id, full_name, email, role_id)
VALUES
  (1, 'Alex Smith', 'alex@example.com', 1),
  (2, 'Dr. Smith', 'dr.smith@example.com', 2)
ON DUPLICATE KEY UPDATE
  full_name = VALUES(full_name),
  email = VALUES(email),
  role_id = VALUES(role_id);

INSERT INTO teams (id, name)
VALUES
  (1, 'CS-401 Senior Capstone')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO team_members (team_id, user_id, is_leader)
VALUES
  (1, 1, 1)
ON DUPLICATE KEY UPDATE is_leader = VALUES(is_leader);

INSERT INTO submissions (id, team_id, title)
VALUES
  (1, 1, 'Final Technical Report')
ON DUPLICATE KEY UPDATE
  team_id = VALUES(team_id),
  title = VALUES(title);

INSERT INTO submission_versions (
  id,
  submission_id,
  version_number,
  file_path,
  created_at
)
VALUES
  (1, 1, 1, '/uploads/reports/final-report-v1.pdf', NOW() - INTERVAL 7 DAY),
  (2, 1, 2, '/uploads/reports/final-report-v2.pdf', NOW() - INTERVAL 1 DAY)
ON DUPLICATE KEY UPDATE
  submission_id = VALUES(submission_id),
  version_number = VALUES(version_number),
  file_path = VALUES(file_path),
  created_at = VALUES(created_at);

INSERT INTO feedbacks (
  id,
  submission_version_id,
  supervisor_id,
  content,
  created_at
)
VALUES
  (
    1,
    2,
    2,
    'Cấu trúc báo cáo tốt. Cần bổ sung thêm tài liệu API edge-case.',
    NOW() - INTERVAL 10 HOUR
  ),
  (
    2,
    2,
    2,
    'Phần benchmark rõ ràng, có cải thiện đáng kể so với phiên bản trước.',
    NOW() - INTERVAL 2 HOUR
  )
ON DUPLICATE KEY UPDATE
  submission_version_id = VALUES(submission_version_id),
  supervisor_id = VALUES(supervisor_id),
  content = VALUES(content),
  created_at = VALUES(created_at);

COMMIT;
