import React, { useState, useEffect } from 'react';
import './Reports.css';

const Reports = () => {
  const [reports, setReports] = useState([
    { id: 1, name: 'Phan_tich_yeu_cau_STMSUAI.pdf', milestone: 'Milestone 1', date: '15/03/2026', size: '1.2 MB', sender: 'Nga (Student)', type: 'pdf' },
    { id: 2, name: 'Design_Document_V1.docx', milestone: 'Milestone 2', date: '22/03/2026', size: '2.5 MB', sender: 'Nga (Student)', type: 'docx' }
  ]);

  const [selectedMilestone, setSelectedMilestone] = useState('Milestone 1');
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState({ name: '', milestone: '' });
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });

  const showToast = (message, type = 'success') => {
    setNotification({ show: true, message, type });
  };

  useEffect(() => {
    if (notification.show) {
      const timer = setTimeout(() => {
        setNotification({ ...notification, show: false });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification.show]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileExtension = file.name.split('.').pop().toLowerCase();
    const newFile = {
      id: Date.now(),
      name: file.name,
      milestone: selectedMilestone,
      date: new Date().toLocaleDateString('vi-VN'),
      size: (file.size / (1024 * 1024)).toFixed(1) + ' MB',
      sender: 'Nga (Student)',
      type: fileExtension
    };

    setReports([newFile, ...reports]);
    showToast(`Đã tải lên báo cáo cho ${selectedMilestone}!`, 'success');
    e.target.value = null; 
  };

  const deleteFile = (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa báo cáo này không?')) {
      setReports(reports.filter(r => r.id !== id));
      showToast('Đã xóa báo cáo thành công!', 'error');
    }
  };

  const downloadFile = (report) => {
    // 1. Tạo nội dung giả lập cho file 
    const fileContent = `Báo cáo: ${report.name}\nMilestone: ${report.milestone}\nNgày nộp: ${report.date}\nNgười nộp: ${report.sender}`;
    const blob = new Blob([fileContent], { type: 'text/plain' });
    
    // 2. Tạo một đường dẫn (URL) tạm thời cho file
    const url = window.URL.createObjectURL(blob);
    
    // 3. Tạo một thẻ <a> ẩn để kích hoạt lệnh tải
    const link = document.createElement('a');
    link.href = url;
    link.download = report.name; // Đặt tên file khi tải về
    
    document.body.appendChild(link);
    link.click(); // Kích hoạt tải xuống
    
    // 4. Dọn dẹp
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    showToast(`Đang tải xuống: ${report.name}`, 'success');
  };

  const startEdit = (report) => {
    setEditingId(report.id);
    setEditValue({ name: report.name, milestone: report.milestone });
  };

  const saveEdit = (id) => {
    setReports(reports.map(r => 
      r.id === id ? { ...r, name: editValue.name, milestone: editValue.milestone } : r
    ));
    setEditingId(null);
    showToast('Cập nhật thông tin thành công!', 'success');
  };

  return (
    <div className="reports-container">
      {/* Toast Notification góc phải */}
      {notification.show && (
        <div className={`toast-notification ${notification.type}`}>
          <div className="toast-content">
            <span className="toast-icon">
              {notification.type === 'error' ? '🗑️' : '✅'}
            </span>
            <span className="toast-message">{notification.message}</span>
            <button className="toast-close-btn" onClick={() => setNotification({ ...notification, show: false })}>×</button>
          </div>
          <div className="toast-progress"></div>
        </div>
      )}

      <div className="content-header">
        <h1>Báo cáo dự án</h1>
        <p className="subtitle">Hệ thống quản lý báo cáo MentorAI Grad.</p>
      </div>

      <div className="section-card">
        <div className="upload-wrapper">
          <div className="form-field">
            <label>Chọn Milestone nộp bài</label>
            <select value={selectedMilestone} onChange={(e) => setSelectedMilestone(e.target.value)} className="milestone-select">
              <option value="Milestone 1">Milestone 1: Đề xuất dự án</option>
              <option value="Milestone 2">Milestone 2: Thiết kế hệ thống</option>
              <option value="Milestone 3">Milestone 3: Bản demo sản phẩm</option>
              <option value="Final Thesis">Báo cáo cuối kỳ (Thesis)</option>
            </select>
          </div>
          <div className="form-field">
            <label>Tải lên tệp mới</label>
            <label htmlFor="file-upload" className="submit-update-btn" style={{ cursor: 'pointer' }}>
              <span>📁</span> Chọn file từ máy tính
            </label>
            <input type="file" id="file-upload" onChange={handleFileUpload} accept=".pdf,.docx" hidden />
          </div>
        </div>
      </div>

      <div className="section-card">
        <div className="table-responsive">
          <table className="report-table">
            <thead>
              <tr>
                <th>Tên báo cáo</th>
                <th>Milestone</th>
                <th>Ngày nộp</th>
                <th style={{ textAlign: 'right' }}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.id}>
                  <td>
                    {editingId === report.id ? (
                      <input 
                        className="edit-input"
                        value={editValue.name} 
                        onChange={(e) => setEditValue({...editValue, name: e.target.value})}
                      />
                    ) : (
                      <div className="file-info-cell">
                        <span className={`file-icon-bg ${report.type}`}>{report.type.toUpperCase()}</span>
                        <span className="file-name-text">{report.name}</span>
                      </div>
                    )}
                  </td>
                  <td>
                    {editingId === report.id ? (
                      <select 
                        className="edit-select"
                        value={editValue.milestone} 
                        onChange={(e) => setEditValue({...editValue, milestone: e.target.value})}
                      >
                        <option>Milestone 1</option>
                        <option>Milestone 2</option>
                        <option>Milestone 3</option>
                        <option>Final Thesis</option>
                      </select>
                    ) : (
                      <span className="milestone-badge">{report.milestone}</span>
                    )}
                  </td>
                  <td>{report.date}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="action-buttons">
                      {editingId === report.id ? (
                        <button className="btn-save" onClick={() => saveEdit(report.id)}>Lưu</button>
                      ) : (
                        <>
                          <button className="btn-icon" onClick={() => downloadFile(report.name)} title="Tải xuống">📥</button>
                          <button className="btn-icon" onClick={() => startEdit(report)} title="Sửa">✏️</button>
                          <button className="btn-icon delete" onClick={() => deleteFile(report.id)} title="Xóa">🗑️</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;