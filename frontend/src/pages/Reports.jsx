import React, { useState, useRef, useEffect, useCallback } from 'react';
import axios from '../utils/axios';
import './Reports.css';

import ConfirmModal from '../components/ConfirmModal/ConfirmModal';
import Toast from '../components/Toast/Toast';

const Reports = () => {
  const fileInputRef = useRef(null);
  
  const [documents, setDocuments] = useState([]);
  const [tempFile, setTempFile] = useState(null);
  const [selectedMilestoneId, setSelectedMilestoneId] = useState("");
  const [milestoneOptions, setMilestoneOptions] = useState([]);
  
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, type: '', data: null, title: '', message: '' });

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);
  const [inlineEditingId, setInlineEditingId] = useState(null); 
  const [newFileName, setNewFileName] = useState('');
  const [fileExtension, setFileExtension] = useState(''); // State lưu đuôi file

  const showToast = useCallback((message, type = 'success') => {
    setToast({ show: true, message, type });
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/reports', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        const docs = res.data.data.map(item => {
          // Lấy phiên bản mới nhất
          const latestVersion = item.versions[item.versions.length - 1];
          return {
            id: item.milestone.id,
            milestone: item.milestone.name,
            // ƯU TIÊN: hiển thị file_name từ DB, nếu chưa có thì dùng logic cắt path
            name: latestVersion?.file_name || (latestVersion ? latestVersion.file_path.split(/[\\/]/).pop() : item.milestone.name),
            versions: item.versions.map(v => ({
              id: v.id,
              fileName: v.file_name || v.file_path.split(/[\\/]/).pop(),
              v: v.version_number,
              date: new Date(v.submitted_at).toLocaleDateString('vi-VN')
            })),
            status: item.versions.length ? 'Submitted' : 'Not Submitted',
            submissionId: item.submission ? item.submission.id : null
          };
        });
        setDocuments(docs);
        setMilestoneOptions(res.data.data.map(item => ({ id: item.milestone.id, name: item.milestone.name })));
      }
    } catch (error) {
      showToast("Lỗi khi tải dữ liệu", "error");
    }
  }, [showToast]);

  useEffect(() => { 
    fetchData(); 
  }, [fetchData]);

  const onFileChange = (e) => {
    const file = e.target.files[0];
    if (file) setTempFile(file);
  };

  const handleUpload = async () => {
  if (!tempFile || !selectedMilestoneId) return showToast("Please select a file and milestone", "error");

  // 1. Lấy thông tin file gốc
  const originalName = tempFile.name;
  const lastDotIndex = originalName.lastIndexOf('.');
  const name = originalName.substring(0, lastDotIndex);
  const ext = originalName.substring(lastDotIndex);

  // 2. Tạo tên file mới với timestamp để tránh trùng lặp/ghi đè
  // Định dạng: TenFile_17123456789.docx
  const uniqueFileName = `${name}_${Date.now()}${ext}`;

  const formData = new FormData();
  
  // 3. Sử dụng tham số thứ 3 của append để ghi đè tên file gửi đi
  formData.append('report', tempFile, uniqueFileName); 
  formData.append('milestone_id', selectedMilestoneId);

  try {
    const token = localStorage.getItem('token');
    const res = await axios.post('/api/reports/upload', formData, {
      headers: { 
        Authorization: `Bearer ${token}`, 
        'Content-Type': 'multipart/form-data' 
      }
    });
    
    if (res.data.success) {
      showToast("Uploaded successfully!");
      setTempFile(null);
      setSelectedMilestoneId("");
      fetchData();
    }
  } catch (error) {
    showToast('Submission failed.', "error");
  }
};

  const triggerDeleteAll = (doc) => {
    setConfirmConfig({
      isOpen: true,
      type: 'DELETE_ALL',
      data: doc,
      title: "Delete entire history?",
      message: `Are you sure you want to delete all versions of "${doc.milestone}"?`
    });
  };

  const triggerDeleteVersion = (versionId) => {
    setConfirmConfig({
      isOpen: true,
      type: 'DELETE_VERSION',
      data: versionId,
      title: "Delete this version?",
      message: "This action will permanently delete the selected file."
    });
  };

  const handleConfirmAction = async () => {
    const { type, data } = confirmConfig;
    const token = localStorage.getItem('token');
    try {
      if (type === 'DELETE_ALL') {
        await axios.delete(`/api/reports/${data.submissionId}`, { headers: { Authorization: `Bearer ${token}` } });
        showToast("History cleared successfully");
      } else if (type === 'DELETE_VERSION') {
        await axios.delete(`/api/reports/version/${data}`, { headers: { Authorization: `Bearer ${token}` } });
        showToast("Version deleted successfully");
        setIsEditModalOpen(false);
      }
      fetchData();
    } catch (error) {
      showToast("Delete failed", "error");
    }
    setConfirmConfig(prev => ({ ...prev, isOpen: false }));
  };

  const handleViewFile = async (versionId, originalFileName) => {
    try {
      const res = await axios.get(`/api/reports/version/${versionId}/download`, { responseType: 'blob' });
      const contentType = res.headers['content-type'];
      const blob = new Blob([res.data], { type: contentType });
      const fileURL = window.URL.createObjectURL(blob);
      if (contentType.includes('word') || contentType.includes('officedocument')) {
        const link = document.createElement('a');
        link.href = fileURL; link.download = originalFileName;
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
      } else { window.open(fileURL, '_blank'); }
    } catch (error) { showToast('Error opening file.', "error"); }
  };

  const handleDownload = async (versionId, originalFileName) => {
    try {
      const res = await axios.get(`/api/reports/version/${versionId}/download`, { responseType: 'blob' });
      const blob = new Blob([res.data]);
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = originalFileName;
      document.body.appendChild(link); link.click(); document.body.removeChild(link);
    } catch (error) { showToast('Error downloading file.', "error"); }
  };

  // Logic tách tên và định dạng
  const startEditingName = (doc) => {
    const latest = doc.versions[doc.versions.length - 1];
    if (latest) {
      const fullFileName = latest.fileName;
      const lastDotIndex = fullFileName.lastIndexOf('.');
      
      if (lastDotIndex !== -1) {
        setNewFileName(fullFileName.substring(0, lastDotIndex));
        setFileExtension(fullFileName.substring(lastDotIndex)); // Lưu lại .pdf, .docx...
      } else {
        setNewFileName(fullFileName);
        setFileExtension('');
      }
      
      setInlineEditingId(doc.id);
    }
  };

  const saveInlineFileName = async (versionId) => {
    if (!newFileName.trim()) return;
    
    // Tự động nối lại đuôi file khi gửi lên Server
    const finalFileName = `${newFileName.trim()}${fileExtension}`;
    
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/reports/version/${versionId}/name`, 
        { file_name: finalFileName },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showToast('Filename updated successfully');
      setInlineEditingId(null);
      fetchData();
    } catch (error) { showToast('Error updating filename.', "error"); }
  };

  return (
    <div className="modern-container">
      {toast.show && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(prev => ({ ...prev, show: false }))} 
        />
      )}

      <header className="modern-header centered-header">
        <h1>Report Submission Management</h1>
      </header>

      <section className="upload-section-card">
        <div className="upload-grid">
          <div className="file-drop-zone" onClick={() => fileInputRef.current.click()}>
            <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#6366f1', marginBottom: '10px' }}>
              cloud_upload
            </span>
            <p>{tempFile ? tempFile.name : "Click to select a file"}</p>
            <input type="file" ref={fileInputRef} hidden accept=".pdf,.docx,.zip,.rar" onChange={onFileChange} />
          </div>
          <div className="upload-actions">
            <select className="modern-select" value={selectedMilestoneId} onChange={(e) => setSelectedMilestoneId(e.target.value)}>
              <option value="">Select Milestone</option>
              {milestoneOptions.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
            <button className="btn-modern-primary" onClick={handleUpload}>Upload Now</button>
          </div>
        </div>
      </section>

      <div className="modern-card-table">
        <table className="modern-table">
          <thead>
            <tr>
              <th>Milestone</th>
              <th>Document Title</th>
              <th>Status</th>
              <th>Current Version</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc) => {
              const latest = doc.versions[doc.versions.length - 1];
              const isEditing = inlineEditingId === doc.id;

              return (
                <tr key={doc.id} className={doc.status === 'Submitted' ? 'row-success' : ''}>
                  <td><span className={`tag-ms ${doc.milestone.replace(/\s+/g, '-').toLowerCase()}`}>{doc.milestone}</span></td>
                  <td className="font-semibold">{doc.name}</td>
                  <td>
                    <span className={`status-badge ${doc.status === 'Submitted' ? 'is-done' : 'is-pending'}`}>
                      {doc.status === 'Submitted' ? 'Submitted' : 'Not Submitted'}
                    </span>
                  </td>
                  <td>
                    {latest ? (
                      isEditing ? (
                        <div className="inline-edit-box animated-fade-in">
                          <div className="input-with-ext">
                             <input type="text" className="inline-input" value={newFileName} onChange={(e) => setNewFileName(e.target.value)} autoFocus />
                             <span className="ext-label">{fileExtension}</span>
                          </div>
                          <div className="inline-edit-actions">
                            <button className="btn-confirm-edit" title="Xác nhận" onClick={() => saveInlineFileName(latest.id)}>
                              <span className="material-symbols-outlined">check</span>
                            </button>
                            <button className="btn-cancel-edit" title="Hủy" onClick={() => setInlineEditingId(null)}>
                              <span className="material-symbols-outlined">close</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="ver-tag-wrapper">
                          <span className="ver-badge">V{latest.v}</span>
                          <div className="ver-filename">{latest.fileName}</div>
                        </div>
                      )
                    ) : '--'}
                  </td>
                  <td className="text-right">
                    <div className="action-group">
                      {doc.versions.length > 0 ? (
                        <>
                          <button className="btn-action edit" title="History" onClick={() => { setEditingDoc(doc); setIsEditModalOpen(true); }}>
                            <span className="material-symbols-outlined">history</span>
                          </button>
                          <button className="btn-action edit" title="Edit Name" onClick={() => startEditingName(doc)}>
                            <span className="material-symbols-outlined">edit</span>
                          </button>
                          <button className="btn-action view" title="View" onClick={() => handleViewFile(latest?.id, latest?.fileName)}>
                            <span className="material-symbols-outlined">visibility</span>
                          </button>
                          <button className="btn-action download" title="Download" onClick={() => handleDownload(latest?.id, latest?.fileName)}>
                            <span className="material-symbols-outlined">download</span>
                          </button>
                          <button className="btn-action delete" title="Delete All" onClick={() => triggerDeleteAll(doc)}>
                            <span className="material-symbols-outlined">delete_forever</span>
                          </button>
                        </>
                      ) : <span className="text-sm-gray">Empty</span>}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {isEditModalOpen && editingDoc && (
        <div className="modal-overlay history-overlay" onClick={() => setIsEditModalOpen(false)}>
          <div className="modal-content history-modal" onClick={e => e.stopPropagation()}>
            <header className="modal-header-modern">
                <h2>Submission History: {editingDoc.milestone}</h2>
                <p className="modal-subtitle">Manage previous versions</p>
            </header>
            <div className="version-list">
              {editingDoc.versions.slice().reverse().map((ver, idx) => (
                <div key={ver.id} className="version-item">
                  <div className="v-info">
                    <div className="v-header-row">
                        <span className="v-num">Version V{ver.v}</span>
                        {idx === 0 && <span className="latest-tag">Latest</span>}
                    </div>
                    <p className="v-name">{ver.fileName}</p>
                    <span className="v-time"> {ver.date} </span>
                  </div>
                  <div className="v-actions-modal">
                    <button className="btn-v-view" title="View" onClick={() => handleViewFile(ver.id, ver.fileName)}>
                      <span className="material-symbols-outlined">visibility</span>
                    </button>
                    <button className="btn-v-dl" title="Download" onClick={() => handleDownload(ver.id, ver.fileName)}>
                      <span className="material-symbols-outlined">download</span>
                    </button>
                    <button className="btn-v-del" title="Delete" onClick={() => triggerDeleteVersion(ver.id)}>
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setIsEditModalOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal 
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        onConfirm={handleConfirmAction}
        onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default Reports;