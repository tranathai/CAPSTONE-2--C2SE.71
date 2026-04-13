-- Chạy script này nếu bảng submissions của bạn chưa có cột milestone_id
-- (Không tạo bảng mới — chỉ bổ sung cột liên kết milestones đã có.)

ALTER TABLE submissions
  ADD COLUMN milestone_id INT NULL AFTER team_id;

-- Thêm FK nếu phù hợp schema của bạn (tên bảng milestones có thể khác):
-- ALTER TABLE submissions
--   ADD CONSTRAINT fk_submissions_milestone
--   FOREIGN KEY (milestone_id) REFERENCES milestones(id);
