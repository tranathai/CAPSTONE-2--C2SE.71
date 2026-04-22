const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const reportController = require('../controllers/reportController');

router.get('/', protect, reportController.getReports);
router.post('/upload', protect, upload.single('report'), reportController.uploadReport);
router.put('/version/:versionId/name', protect, reportController.updateVersionName);
router.delete('/:submissionId', protect, reportController.deleteSubmission);
router.delete('/version/:versionId', protect, reportController.deleteVersion);
// view/download routes không bắt token, để mở trực tiếp từ browser
router.get('/version/:versionId/view', reportController.viewVersion);
router.get('/version/:versionId/download', reportController.downloadVersion);
router.get('/:submissionId/history', protect, reportController.getSubmissionHistory);

module.exports = router;