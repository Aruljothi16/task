import React, { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import {
    X, Upload, FileSpreadsheet, Download, AlertCircle,
    CheckCircle2, Trash2, FolderPlus, Info, Loader2
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { managerService } from '../../services/managerService';

const ImportProjectsModal = ({ onClose, onRefresh, showNotification, isAdmin = false }) => {
    const [file, setFile] = useState(null);
    const [importedData, setImportedData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [step, setStep] = useState(1);
    const [importResults, setImportResults] = useState(null);
    const [managers, setManagers] = useState([]);
    const fileInputRef = useRef(null);

    const service = isAdmin ? adminService : managerService;

    useEffect(() => {
        if (isAdmin) {
            fetchManagers();
        }
    }, [isAdmin]);

    const fetchManagers = async () => {
        try {
            const users = await adminService.getUsers();
            setManagers(users.filter(u => u.role === 'manager' || u.role === 'admin'));
        } catch (error) {
            console.error("Error fetching managers:", error);
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

                const mappedData = json.map(row => {
                    const findKey = (keys) => {
                        const foundKey = Object.keys(row).find(k =>
                            keys.some(key => k.toLowerCase().includes(key.toLowerCase()))
                        );
                        return foundKey ? row[foundKey] : "";
                    };

                    const managerName = findKey(['manager', 'assigned to', 'manager name']);
                    let managerId = "";
                    if (isAdmin && managerName) {
                        const found = managers.find(m =>
                            m.full_name.toLowerCase().includes(managerName.toLowerCase()) ||
                            m.email.toLowerCase().includes(managerName.toLowerCase())
                        );
                        if (found) managerId = found.id;
                    }

                    return {
                        name: findKey(['name', 'project name', 'title']),
                        description: findKey(['description', 'desc', 'summary']),
                        priority: findKey(['priority', 'importance']) || 'medium',
                        status: findKey(['status', 'state']) || 'active',
                        manager_id: managerId,
                        manager_name: managerName,
                        start_date: findKey(['start', 'start date', 'begin']),
                        due_date: findKey(['due', 'due date', 'deadline', 'end']),
                        isValid: true,
                        error: ""
                    };
                });

                const validatedData = mappedData.map(project => {
                    let error = "";
                    if (!project.name) error += "Name is required. ";
                    if (isAdmin && !project.manager_id && project.manager_name) {
                        error += `Manager "${project.manager_name}" not found. `;
                    }

                    const priorities = ['low', 'medium', 'high', 'urgent'];
                    if (!priorities.includes(project.priority.toLowerCase())) {
                        project.priority = 'medium';
                    } else {
                        project.priority = project.priority.toLowerCase();
                    }

                    return { ...project, isValid: error === "", error };
                });

                setImportedData(validatedData);
                setStep(2);
            } catch (error) {
                showNotification("Error parsing file", "error");
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const handleImport = async () => {
        const validProjects = importedData.filter(p => p.isValid);
        setLoading(true);
        try {
            const result = await service.importProjects(validProjects);
            setImportResults(result.summary);
            setStep(3);
            onRefresh();
        } catch (error) {
            showNotification(error.message || "Failed to import", "error");
        } finally {
            setLoading(false);
        }
    };

    const downloadTemplate = () => {
        const templateData = [
            { "Project Name": "Website Redesign", "Description": "Making it mobile friendly", "Priority": "High", "Status": "active", "Manager": isAdmin ? "John Manager" : "" },
            { "Project Name": "Mobile App", "Description": "New iOS app", "Priority": "Urgent", "Status": "active", "Manager": isAdmin ? "Jane Manager" : "" }
        ];
        const ws = XLSX.utils.json_to_sheet(templateData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Projects");
        XLSX.writeFile(wb, "project_import_template.xlsx");
    };

    return (
        <div style={styles.modalOverlay}>
            <div style={{ ...styles.modal, maxWidth: step === 2 ? '950px' : '550px' }}>
                <div style={styles.modalHeader}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={styles.iconBox}><FolderPlus size={24} /></div>
                        <div>
                            <h2 style={styles.modalTitle}>Import Projects</h2>
                            <p style={styles.modalSubtitle}>Bulk create projects from file</p>
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
                                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                onDragLeave={() => setIsDragging(false)}
                                onDrop={(e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0]); }}
                                onClick={() => fileInputRef.current.click()}
                            >
                                <Upload size={40} style={{ color: 'var(--primary)', marginBottom: '16px', opacity: 0.7 }} />
                                <h3 style={{ margin: '0 0 8px 0' }}>Upload Project List</h3>
                                <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Supports .xlsx, .xls, .csv</p>
                                <input type="file" ref={fileInputRef} onChange={(e) => e.target.files[0] && processFile(e.target.files[0])} style={{ display: 'none' }} />
                            </div>
                            <div style={styles.infoCard}>
                                <Info size={18} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                                <div style={{ fontSize: '14px' }}>
                                    Required: <strong>Project Name</strong>. Optional: Description, Priority, Status, {isAdmin && "Manager Name"}.
                                </div>
                                <button style={styles.templateButton} onClick={downloadTemplate}><Download size={16} /> Template</button>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={styles.tableWrapper}>
                                <table style={styles.table}>
                                    <thead>
                                        <tr>
                                            <th style={styles.th}>Project Name</th>
                                            <th style={styles.th}>Description</th>
                                            {isAdmin && <th style={styles.th}>Manager</th>}
                                            <th style={styles.th}>Priority</th>
                                            <th style={styles.th}>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {importedData.map((p, idx) => (
                                            <tr key={idx} style={{ ...styles.tr, opacity: p.isValid ? 1 : 0.6 }}>
                                                <td style={styles.td}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        {!p.isValid && <AlertCircle size={14} color="#ef4444" title={p.error} />}
                                                        {p.name || <span style={{ color: '#ef4444' }}>Missing</span>}
                                                    </div>
                                                </td>
                                                <td style={styles.td}><div style={styles.truncate}>{p.description || '-'}</div></td>
                                                {isAdmin && <td style={styles.td}>{p.manager_name || (p.isValid ? 'Current Admin' : '-')}</td>}
                                                <td style={styles.td}><span style={styles.tag}>{p.priority}</span></td>
                                                <td style={styles.td}><span style={styles.tag}>{p.status}</span></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div style={{ textAlign: 'center', padding: '20px' }}>
                            <CheckCircle2 size={60} color="#10b981" style={{ marginBottom: '20px' }} />
                            <h2>Import Finished</h2>
                            <p>{importResults?.processed} projects imported successfully</p>
                            {importResults?.errors.length > 0 && (
                                <div style={styles.errorList}>
                                    {importResults.errors.map((e, i) => <div key={i} style={styles.errorItem}>{e.name}: {e.message}</div>)}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div style={styles.modalFooter}>
                    {step === 1 && <button style={styles.cancelButton} onClick={onClose}>Cancel</button>}
                    {step === 2 && (
                        <>
                            <button style={styles.cancelButton} onClick={() => setStep(1)}>Back</button>
                            <button style={styles.saveButton} onClick={handleImport} disabled={loading || !importedData.some(p => p.isValid)}>
                                {loading ? <Loader2 className="animate-spin" /> : <FolderPlus size={18} />} Import Projects
                            </button>
                        </>
                    )}
                    {step === 3 && <button style={styles.saveButton} onClick={onClose}>Done</button>}
                </div>
            </div>
        </div>
    );
};

const styles = {
    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, backdropFilter: 'blur(4px)' },
    modal: { background: 'var(--bg-surface)', borderRadius: '20px', width: '90%', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' },
    modalHeader: { padding: '20px 30px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    iconBox: { padding: '10px', background: 'var(--bg-body)', borderRadius: '12px', color: 'var(--primary)' },
    modalTitle: { margin: 0, fontSize: '18px', fontWeight: '700' },
    modalSubtitle: { margin: 0, fontSize: '13px', color: 'var(--text-secondary)' },
    modalClose: { background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' },
    modalBody: { padding: '30px', maxHeight: '60vh', overflowY: 'auto' },
    dropZone: { border: '2px dashed var(--border-light)', borderRadius: '16px', padding: '50px 20px', textAlign: 'center', cursor: 'pointer' },
    infoCard: { padding: '15px', background: 'var(--bg-body)', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '15px', position: 'relative' },
    templateButton: { marginLeft: 'auto', padding: '6px 12px', background: 'white', border: '1px solid var(--border-light)', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' },
    tableWrapper: { border: '1px solid var(--border-light)', borderRadius: '12px', overflow: 'hidden' },
    table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left' },
    th: { padding: '12px 15px', background: 'var(--bg-body)', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' },
    td: { padding: '12px 15px', fontSize: '13px', borderBottom: '1px solid var(--border-light)' },
    tr: { transition: 'background 0.2s' },
    truncate: { maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
    tag: { padding: '4px 8px', background: 'var(--bg-body)', borderRadius: '12px', fontSize: '11px', textTransform: 'capitalize' },
    modalFooter: { padding: '20px 30px', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'flex-end', gap: '12px' },
    cancelButton: { padding: '10px 20px', background: 'transparent', border: '1px solid var(--border-light)', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' },
    saveButton: { padding: '10px 20px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' },
    errorList: { marginTop: '20px', textAlign: 'left', background: '#fef2f2', padding: '15px', borderRadius: '12px' },
    errorItem: { fontSize: '12px', color: '#dc2626', marginBottom: '4px' }
};

export default ImportProjectsModal;
