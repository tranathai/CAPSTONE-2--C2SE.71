/** Phát sau khi sinh viên nộp / sửa / xóa bài — dashboard cập nhật cảnh báo & tiến độ. */
export const STUDENT_SUBMISSIONS_CHANGED = "student-submissions-changed";

export function notifyStudentSubmissionsChanged() {
  window.dispatchEvent(new CustomEvent(STUDENT_SUBMISSIONS_CHANGED));
}
