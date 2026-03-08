import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
    X, Upload, FileSpreadsheet, Download, AlertCircle,
    CheckCircle2, Trash2, UserPlus, Info, Loader2
} from 'lucide-react';
import { adminService } from '../../../services/adminService';

const ImportUsersModal = ({ onClose, onRefresh, showNotification }) => {
    const [file, setFile] = useState(null);
    const [importedData, setImportedData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [step, setStep] = useState(1); // 1: Upload, 2: Preview, 3: Result
    const [importResults, setImportResults] = useState(null);
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            processFile(selectedFile);
        }
    };

    const processFile = (file) => {
        if (!file.name.match(/\.(xlsx|xls|csv)$/)) {
            showNotification("Please upload an Excel or CSV file", "error");
            return;
        }

        setFile(file);
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const json = XLSX.utils.sheet_to_json(worksheet);

                if (json.length === 0) {
                    showNotification("The file is empty", "error");
                    return;
                }

                // Map column names to our expected format (case-insensitive)
                const mappedData = json.map(row => {
                    const findKey = (keys) => {
                        const foundKey = Object.keys(row).find(k =>
                            keys.some(key => k.toLowerCase().includes(key.toLowerCase()))
                        );
                        return foundKey ? row[foundKey] : "";
                    };

                    return {
                        full_name: findKey(['name', 'full name', 'fullname']),
                        email: findKey(['email', 'mail', 'email address']),
                        role: findKey(['role', 'type', 'position']) || 'member',
                        designation: findKey(['designation', 'job', 'title']),
                        isValid: true,
                        error: ""
                    };
                });

                // Basic validation
                const validatedData = mappedData.map(user => {
                    let error = "";
                    if (!user.full_name) error += "Name is required. ";
                    if (!user.email) error += "Email is required. ";
                    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)) error += "Invalid email format. ";

                    const validRoles = ['admin', 'manager', 'member'];
                    if (!validRoles.includes(user.role.toLowerCase())) {
                        user.role = 'member'; // Default to member if invalid
                    } else {
                        user.role = user.role.toLowerCase();
                    }

                    return { ...user, isValid: error === "", error };
                });

                setImportedData(validatedData);
                setStep(2);
            } catch (error) {
                console.error("Error parsing file:", error);
                showNotification("Error parsing file. Please check the format.", "error");
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) {
            processFile(droppedFile);
        }
    };

    const removeUser = (index) => {
        const newData = [...importedData];
        newData.splice(index, 1);
        setImportedData(newData);
        if (newData.length === 0) {
            setStep(1);
            setFile(null);
        }
    };

    const downloadTemplate = () => {
        const templateData = [
            { "Full Name": "John Doe", "Email": "john@example.com", "Role": "member", "Designation": "Developer" },
            { "Full Name": "Jane Smith", "Email": "jane@example.com", "Role": "manager", "Designation": "Project Manager" },
            { "Full Name": "Admin User", "Email": "admin@example.com", "Role": "admin", "Designation": "System Admin" }
        ];
        const ws = XLSX.utils.json_to_sheet(templateData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Users");
        XLSX.writeFile(wb, "user_import_template.xlsx");
    };

    const handleImport = async () => {
        const validUsers = importedData.filter(u => u.isValid);
        if (validUsers.length === 0) {
            showNotification("No valid users to import", "error");
            return;
        }

        setLoading(true);
        try {
            const result = await adminService.importUsers(validUsers);
            setImportResults(result.summary);
            setStep(3);
            onRefresh(); // Refresh user list
        } catch (error) {
            console.error("Import error:", error);
            showNotification(error.message || "Failed to import users", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.modalOverlay}>
            <div style={{ ...styles.modal, maxWidth: step === 2 ? '900px' : '550px' }}>
                <div style={styles.modalHeader}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            padding: '10px',
                            background: 'color-mix(in srgb, var(--primary) 10%, transparent)',
                            borderRadius: '12px',
                            color: 'var(--primary)'
                        }}>
                            <FileSpreadsheet size={24} />
                        </div>
                        <div>
                            <h2 style={styles.modalTitle}>Import Users</h2>
                            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
                                Upload an Excel file to bulk add users
                            </p>
                        </div>
                    </div>
                    <button style={styles.modalClose} onClick={onClose}><X size={20} /></button>
                </div>

                <div style={styles.modalBody}>
                    {step === 1 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div
                                style={{
                                    ...styles.dropZone,
                                    borderColor: isDragging ? 'var(--primary)' : 'var(--border-light)',
                                    background: isDragging ? 'color-mix(in srgb, var(--primary) 5%, transparent)' : 'var(--bg-body)'
                                }}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current.click()}
                            >
                                <Upload size={40} style={{ color: 'var(--primary)', marginBottom: '16px', opacity: 0.7 }} />
                                <h3 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>Click or drag file to upload</h3>
                                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>
                                    Support for .xlsx, .xls, and .csv
                                </p>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    style={{ display: 'none' }}
                                    accept=".xlsx,.xls,.csv"
                                />
                            </div>

                            <div style={styles.infoCard}>
                                <Info size={18} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                                <div style={{ fontSize: '14px', lineHeight: '1.5' }}>
                                    <strong>Pro Tip:</strong> Your file should have columns for <strong>Full Name</strong>, <strong>Email</strong>, and <strong>Role</strong>.
                                    Role should be one of: <em>admin, manager, member</em>.
                                </div>
                                <button style={styles.templateButton} onClick={(e) => { e.stopPropagation(); downloadTemplate(); }}>
                                    <Download size={16} /> Download Template
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={styles.previewHeader}>
                                <div style={{ display: 'flex', gap: '15px' }}>
                                    <div style={styles.statBadge}>
                                        <strong>{importedData.length}</strong> Total
                                    </div>
                                    <div style={{ ...styles.statBadge, color: '#10b981', background: '#ecfdf5' }}>
                                        <strong>{importedData.filter(u => u.isValid).length}</strong> Valid
                                    </div>
                                    {importedData.some(u => !u.isValid) && (
                                        <div style={{ ...styles.statBadge, color: '#ef4444', background: '#fef2f2' }}>
                                            <strong>{importedData.filter(u => !u.isValid).length}</strong> Invalid
                                        </div>
                                    )}
                                </div>
                                <button style={styles.cancelButton} onClick={() => { setStep(1); setFile(null); }}>
                                    Replace File
                                </button>
                            </div>

                            <div style={styles.tableWrapper}>
                                <table style={styles.table}>
                                    <thead>
                                        <tr>
                                            <th style={styles.th}>Full Name</th>
                                            <th style={styles.th}>Email</th>
                                            <th style={styles.th}>Role</th>
                                            <th style={styles.th}>Designation</th>
                                            <th style={styles.th}>Status</th>
                                            <th style={styles.th}></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {importedData.map((user, idx) => (
                                            <tr key={idx} style={{ ...styles.tr, opacity: user.isValid ? 1 : 0.7 }}>
                                                <td style={styles.td}>{user.full_name || <span style={{ color: '#ef4444' }}>Missing</span>}</td>
                                                <td style={styles.td}>{user.email || <span style={{ color: '#ef4444' }}>Missing</span>}</td>
                                                <td style={styles.td}>
                                                    <span style={{
                                                        padding: '4px 10px',
                                                        background: 'var(--bg-body)',
                                                        borderRadius: '20px',
                                                        fontSize: '12px',
                                                        textTransform: 'capitalize'
                                                    }}>{user.role}</span>
                                                </td>
                                                <td style={styles.td}>{user.designation || '-'}</td>
                                                <td style={styles.td}>
                                                    {user.isValid ? (
                                                        <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}>
                                                            <CheckCircle2 size={14} /> Ready
                                                        </span>
                                                    ) : (
                                                        <span style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }} title={user.error}>
                                                            <AlertCircle size={14} /> Invalid
                                                        </span>
                                                    )}
                                                </td>
                                                <td style={styles.td}>
                                                    <button style={styles.deleteIcon} onClick={() => removeUser(idx)}>
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {step === 3 && importResults && (
                        <div style={{ textAlign: 'center', padding: '20px 0' }}>
                            <div style={{
                                width: '64px', height: '64px', borderRadius: '50%', background: '#ecfdf5',
                                color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                margin: '0 auto 20px'
                            }}>
                                <CheckCircle2 size={40} />
                            </div>
                            <h2 style={{ marginBottom: '8px' }}>Import Completed!</h2>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '30px' }}>
                                We've successfully processed your user import request.
                            </p>

                            <div style={styles.resultsGrid}>
                                <div style={styles.resultItem}>
                                    <div style={styles.resultLabel}>Processed</div>
                                    <div style={styles.resultValue}>{importResults.processed}</div>
                                </div>
                                <div style={styles.resultItem}>
                                    <div style={styles.resultLabel}>Failed</div>
                                    <div style={{ ...styles.resultValue, color: importResults.errors.length > 0 ? '#ef4444' : 'inherit' }}>
                                        {importResults.errors.length}
                                    </div>
                                </div>
                            </div>

                            {importResults.errors.length > 0 && (
                                <div style={styles.errorList}>
                                    <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#7f1d1d' }}>Errors Encountered:</h4>
                                    {importResults.errors.map((err, i) => (
                                        <div key={i} style={styles.errorItem}>
                                            <strong>{err.email}:</strong> {err.message}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div style={styles.modalFooter}>
                    {step === 1 && (
                        <button style={styles.cancelButton} onClick={onClose}>Cancel</button>
                    )}
                    {step === 2 && (
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button style={styles.cancelButton} onClick={() => { setStep(1); setFile(null); }}>Back</button>
                            <button
                                style={styles.saveButton}
                                onClick={handleImport}
                                disabled={loading || importedData.filter(u => u.isValid).length === 0}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" style={{ marginRight: 8 }} />
                                        Importing...
                                    </>
                                ) : (
                                    <>
                                        <UserPlus size={18} style={{ marginRight: 8 }} />
                                        Import {importedData.filter(u => u.isValid).length} Users
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                    {step === 3 && (
                        <button style={styles.saveButton} onClick={onClose}>Finish</button>
                    )}
                </div>
            </div>
            <style>{`
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
        </div>
    );
};

const styles = {
    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, backdropFilter: 'blur(4px)' },
    modal: { background: 'var(--bg-surface)', borderRadius: '24px', width: '95%', transition: 'max-width 0.3s ease', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden' },
    modalHeader: { padding: '24px 30px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-surface)' },
    modalTitle: { margin: '0 0 4px 0', fontSize: '20px', fontWeight: '700', color: 'var(--text-main)' },
    modalClose: { background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '8px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' },
    modalBody: { padding: '30px', maxHeight: '70vh', overflowY: 'auto' },
    dropZone: { border: '2px dashed var(--border-light)', borderRadius: '16px', padding: '60px 20px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s ease' },
    infoCard: { padding: '20px', background: 'var(--bg-body)', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '15px', color: 'var(--text-main)', position: 'relative' },
    templateButton: { marginLeft: 'auto', padding: '8px 12px', background: 'white', border: '1px solid var(--border-light)', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' },
    previewHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' },
    statBadge: { padding: '6px 14px', background: 'var(--bg-body)', borderRadius: '30px', fontSize: '14px', color: 'var(--text-main)' },
    tableWrapper: { border: '1px solid var(--border-light)', borderRadius: '12px', overflow: 'hidden' },
    table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left' },
    th: { padding: '15px', background: 'var(--bg-body)', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-light)' },
    tr: { borderBottom: '1px solid var(--border-light)', transition: 'background 0.2s' },
    td: { padding: '15px', fontSize: '14px', color: 'var(--text-main)' },
    deleteIcon: { background: 'transparent', border: 'none', cursor: 'pointer', color: '#ef4444', opacity: 0.6, transition: 'opacity 0.2s' },
    resultsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', maxWidth: '400px', margin: '0 auto' },
    resultItem: { padding: '20px', borderRadius: '16px', background: 'var(--bg-body)', textAlign: 'center' },
    resultLabel: { fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' },
    resultValue: { fontSize: '28px', fontWeight: '700' },
    errorList: { marginTop: '30px', textAlign: 'left', padding: '15px', background: '#fef2f2', borderRadius: '12px', border: '1px solid #fee2e2' },
    errorItem: { fontSize: '13px', color: '#991b1b', marginBottom: '6px' },
    modalFooter: { padding: '20px 30px', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'flex-end', gap: '15px' },
    cancelButton: { padding: '10px 24px', background: 'transparent', border: '1px solid var(--border-light)', borderRadius: '12px', cursor: 'pointer', color: 'var(--text-main)', fontWeight: '600', fontSize: '14px' },
    saveButton: { padding: '10px 24px', background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))', border: 'none', borderRadius: '12px', color: 'white', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', fontSize: '14px', boxShadow: '0 4px 12px rgba(var(--primary-rgb, 67, 97, 238), 0.3)' },
};

export default ImportUsersModal;
