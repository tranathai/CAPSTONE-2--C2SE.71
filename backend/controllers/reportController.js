const path = require('path');
const fs = require('fs');
const mime = require('mime-types');

const {
  TeamMember,
  Team,
  Milestone,
  Submission,
  SubmissionVersion,
  User
} = require('../models');

// Truy vấn danh sách báo cáo theo team và milestone
exports.getReports = async (req, res) => {
  try {
    const userId = req.user.id;

    // Lấy team của user
    const teamMember = await TeamMember.findOne({ where: { user_id: userId } });
    if (!teamMember) {
      return res.status(403).json({ success: false, message: 'Người dùng chưa thuộc nhóm nào' });
    }

    const teamId = teamMember.team_id;

    const milestones = await Milestone.findAll({ order: [['id', 'ASC']] });

    // Gọi submissions của team
    const submissions = await Submission.findAll({
      where: { team_id: teamId },
      include: [{ model: SubmissionVersion, as: 'SubmissionVersions' }],
    });

    const data = await Promise.all(milestones.map(async (ms) => {
      const submission = submissions.find(s => s.milestone_id === ms.id);
      const versions = submission ? (await SubmissionVersion.findAll({ where: { submission_id: submission.id }, order: [['version_number','ASC']] })) : [];
      return {
        milestone: ms,
        submission: submission || null,
        versions: versions.map(v => ({
          id: v.id,
          file_path: v.file_path,
          version_number: v.version_number,
          status: v.status,
          submitted_at: v.submitted_at,
          file_name: v.file_name
        }))
      };
    }));

    return res.json({ success: true, data });
  } catch (error) {
    console.error('getReports error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi lấy báo cáo', error: error.message });
  }
};

exports.uploadReport = async (req, res) => {
  try {
    const userId = req.user.id;
    const { milestone_id } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'File chưa được tải lên' });
    }

    if (!milestone_id) {
      return res.status(400).json({ success: false, message: 'Chọn milestone cần nộp' });
    }

    const teamMember = await TeamMember.findOne({ where: { user_id: userId } });
    if (!teamMember) {
      return res.status(403).json({ success: false, message: 'Người dùng chưa thuộc nhóm nào' });
    }

    const milestone = await Milestone.findByPk(milestone_id);
    if (!milestone) {
      return res.status(404).json({ success: false, message: 'Milestone không tồn tại' });
    }

    let submission = await Submission.findOne({ where: { team_id: teamMember.team_id, milestone_id } });
    if (!submission) {
      submission = await Submission.create({ team_id: teamMember.team_id, milestone_id });
    }

    const existingVersions = await SubmissionVersion.findAll({ where: { submission_id: submission.id } });
    const nextVersion = existingVersions.length ? Math.max(...existingVersions.map(v => v.version_number)) + 1 : 1;

    const version = await SubmissionVersion.create({
      submission_id: submission.id,
      file_path: req.file.path,
      file_name: req.file.originalname,
      version_number: nextVersion,
      status: 'on-time',
    });

    return res.status(201).json({
      success: true,
      message: 'Upload thành công',
      data: {
        submission_id: submission.id,
        version: {
          id: version.id,
          file_name: version.file_name,
          file_path: version.file_path,
          version_number: version.version_number,
          status: version.status,
          submitted_at: version.submitted_at
        }
      }
    });
  } catch (error) {
    console.error('uploadReport error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi upload báo cáo', error: error.message });
  }
};

// Xóa 1 submission (TOÀN BỘ phiên bản)
exports.deleteSubmission = async (req, res) => {
  try {
    const userId = req.user.id;
    const submissionId = parseInt(req.params.submissionId, 10);

    const teamMember = await TeamMember.findOne({ where: { user_id: userId } });
    if (!teamMember) return res.status(403).json({ success: false, message: 'Không có quyền' });

    const submission = await Submission.findByPk(submissionId);
    if (!submission || submission.team_id !== teamMember.team_id) {
      return res.status(404).json({ success: false, message: 'Submission không tồn tại' });
    }

    const versions = await SubmissionVersion.findAll({ where: { submission_id: submissionId }});
    for (const v of versions) {
      if (v.file_path && fs.existsSync(v.file_path)) fs.unlinkSync(v.file_path);
    }

    await SubmissionVersion.destroy({ where: { submission_id: submissionId } });
    await submission.destroy();

    return res.json({ success: true, message: 'Đã xóa submission và toàn bộ phiên bản' });
  } catch (error) {
    console.error('deleteSubmission error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi xóa submission', error: error.message });
  }
};

// Xóa một phiên bản cụ thể
exports.deleteVersion = async (req, res) => {
  try {
    const userId = req.user.id;
    const versionId = parseInt(req.params.versionId, 10);

    const version = await SubmissionVersion.findByPk(versionId);
    if (!version) {
      return res.status(404).json({ success: false, message: 'Phiên bản không tồn tại' });
    }

    const teamMember = await TeamMember.findOne({ where: { user_id: userId } });
    if (!teamMember) return res.status(403).json({ success: false, message: 'Không có quyền' });

    const submission = await Submission.findByPk(version.submission_id);
    if (!submission || submission.team_id !== teamMember.team_id) {
      return res.status(403).json({ success: false, message: 'Không có quyền thao tác' });
    }

    if (version.file_path && fs.existsSync(version.file_path)) {
      fs.unlinkSync(version.file_path);
    }

    await version.destroy();
    return res.json({ success: true, message: 'Đã xóa phiên bản' });
  } catch (error) {
    console.error('deleteVersion error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi xóa phiên bản', error: error.message });
  }
};

// Xem file trực tiếp trong browser
exports.viewVersion = async (req, res) => {
  try {
    const versionId = parseInt(req.params.versionId, 10);
    const version = await SubmissionVersion.findByPk(versionId);
    if (!version || !version.file_path) {
      return res.status(404).json({ success: false, message: 'File không tồn tại' });
    }

    const filePath = path.resolve(version.file_path);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'File vật lý không tìm thấy' });
    }

    const fileName = path.basename(filePath);
    const mimeType = mime.lookup(fileName) || 'application/octet-stream';

    res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
    res.setHeader('Content-Type', mimeType);

    const fileStream = fs.createReadStream(filePath);
    fileStream.on('error', (streamErr) => {
      console.error('Stream error:', streamErr);
      res.status(500).json({ success: false, message: 'Lỗi đọc file', error: streamErr.message });
    });
    fileStream.pipe(res);
  } catch (error) {
    console.error('viewVersion error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi xem file', error: error.message });
  }
};
// Download phiên bản
exports.downloadVersion = async (req, res) => {
  try {
    const version = await SubmissionVersion.findByPk(req.params.versionId);
    const filePath = path.resolve(version.file_path);
    
    // Trả file về với tên hiển thị từ DB
    return res.download(filePath, version.file_name); 
  } catch (error) {
    console.error('downloadVersion error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi tải file', error: error.message });
  }
};

// Cập nhật tên file của phiên bản
exports.updateVersionName = async (req, res) => {
  try {
    const { file_name } = req.body;
    const versionId = req.params.versionId;

    const version = await SubmissionVersion.findByPk(versionId);
    if (!version) return res.status(404).json({ message: 'Không tìm thấy' });

    // Chỉ cập nhật tên hiển thị trong DB
    await version.update({ file_name: file_name.trim() });

    return res.json({ success: true, message: 'Đã đổi tên hiển thị' });
  } catch (error) {
    console.error('updateVersionName error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi cập nhật tên file', error: error.message });
  }
};

// Lấy lịch sử các phiên bản của 1 submission
exports.getSubmissionHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const submissionId = parseInt(req.params.submissionId, 10);

    const teamMember = await TeamMember.findOne({ where: { user_id: userId } });
    if (!teamMember) {
      return res.status(403).json({ success: false, message: 'Người dùng chưa thuộc nhóm nào' });
    }

    const submission = await Submission.findOne({ where: { id: submissionId, team_id: teamMember.team_id } });
    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission không tồn tại' });
    }

    const versions = await SubmissionVersion.findAll({
      where: { submission_id: submissionId },
      order: [['version_number', 'DESC']]
    });

    return res.json({
      success: true,
      data: versions.map(v => ({
        id: v.id,
        file_path: v.file_path,
        file_name: v.file_name,
        version_number: v.version_number,
        status: v.status,
        submitted_at: v.submitted_at
      }))
    });
  } catch (error) {
    console.error('getSubmissionHistory error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi lấy lịch sử submission', error: error.message });
  }
};