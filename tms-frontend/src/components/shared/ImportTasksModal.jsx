import React, { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import {
    X, Upload, FileSpreadsheet, Download, AlertCircle,
    CheckCircle2, Trash2, ListChecks, Info, Loader2
} from 'lucide-react';
import { managerService } from '../../services/managerService';

const ImportTasksModal = ({ onClose, onRefresh, showNotification, preselectedProjectId = null }) => {
    const [file, setFile] = useState(null);
    const [importedData, setImportedData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [step, setStep] = useState(1);
    const [importResults, setImportResults] = useState(null);
    const [projects, setProjects] = useState([]);
    const [members, setMembers] = useState([]);
    const fileInputRef = useRef(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [projData, membData] = await Promise.all([
                managerService.getMyProjects(),
                managerService.getTeamMembers()
            ]);
            setProjects(projData);
            setMembers(membData);
        } catch (error) {
            console.error("Error fetching dependencies:", error);
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

                    const pIdentifier = findKey(['project', 'project name', 'project id']);
                    let projectId = preselectedProjectId;
                    let projectName = projects.find(p => p.id === preselectedProjectId)?.name || "";

                    if (!projectId && pIdentifier) {
                        const foundP = projects.find(p =>
                            p.name.toLowerCase().includes(pIdentifier.toString().toLowerCase()) ||
                            p.id.toString() === pIdentifier.toString()
                        );
                        if (foundP) {
                            projectId = foundP.id;
                            projectName = foundP.name;
                        }
                    }

                    const mIdentifier = findKey(['assigned to', 'assignee', 'member', 'email']);
                    let memberId = "";
                    let memberName = mIdentifier;
                    if (mIdentifier) {
                        const foundM = members.find(m =>
                            m.full_name?.toLowerCase().includes(mIdentifier.toLowerCase()) ||
                            m.email?.toLowerCase().includes(mIdentifier.toLowerCase()) ||
                            m.username?.toLowerCase().includes(mIdentifier.toLowerCase())
                        );
                        if (foundM) {
                            memberId = foundM.id;
                            memberName = foundM.full_name || foundM.username;
                        }
                    }

                    return {
                        title: findKey(['title', 'task name', 'task']),
                        description: findKey(['description', 'desc', 'details']),
                        project_id: projectId,
                        project_name: projectName || pIdentifier,
                        assigned_to: memberId,
                        member_name: memberName,
                        priority: findKey(['priority']) || 'medium',
                        status: findKey(['status']) || 'pending',
                        due_date: findKey(['due', 'due date', 'deadline']),
                        isValid: true,
                        error: ""
                    };
                });

                const validatedData = mappedData.map(task => {
                    let error = "";
                    if (!task.title) error += "Title is required. ";
                    if (!task.project_id) error += "Valid project name/ID required. ";
                    if (!task.assigned_to) error += "Valid member name/email required. ";

                    const priorities = ['low', 'medium', 'high', 'urgent'];
                    if (!priorities.includes(task.priority.toLowerCase())) {
                        task.priority = 'medium';
                    } else {
                        task.priority = task.priority.toLowerCase();
                    }

                    return { ...task, isValid: error === "", error };
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
        const validTasks = importedData.filter(t => t.isValid);
        setLoading(true);
        try {
            const result = await managerService.importTasks(validTasks);
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
            { "Title": "Design Landing Page", "Description": "Main UI for homepage", "Project": projects[0]?.name || "Project A", "Assigned To": members[0]?.email || "member@example.com", "Priority": "High", "Due Date": "2026-03-01" },
            { "Title": "Setup Database", "Description": "MySQL migrations", "Project": projects[0]?.name || "Project A", "Assigned To": members[0]?.email || "member@example.com", "Priority": "Medium", "Due Date": "2026-03-05" }
        ];
        const ws = XLSX.utils.json_to_sheet(templateData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Tasks");
        XLSX.writeFile(wb, "task_import_template.xlsx");
    };

    return (
        <div style={styles.modalOverlay}>
            <div style={{ ...styles.modal, maxWidth: step === 2 ? '1000px' : '550px' }}>
                <div style={styles.modalHeader}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={styles.iconBox}><ListChecks size={24} /></div>
                        <div>
                            <h2 style={styles.modalTitle}>Import Tasks</h2>
                            <p style={styles.modalSubtitle}>Bulk add tasks to projects</p>
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
                                <h3 style={{ margin: '0 0 8px 0' }}>Upload Task List</h3>
                                <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Supports .xlsx, .xls, .csv</p>
                                <input type="file" ref={fileInputRef} onChange={(e) => e.target.files[0] && processFile(e.target.files[0])} style={{ display: 'none' }} />
                            </div>
                            <div style={styles.infoCard}>
                                <Info size={18} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                                <div style={{ fontSize: '14px' }}>
                                    Required: <strong>Title</strong>, <strong>Project</strong>, <strong>Assigned To</strong>.
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
                                            <th style={styles.th}>Task Title</th>
                                            <th style={styles.th}>Project</th>
                                            <th style={styles.th}>Assigned To</th>
                                            <th style={styles.th}>Priority</th>
                                            <th style={styles.th}>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {importedData.map((t, idx) => (
                                            <tr key={idx} style={{ ...styles.tr, opacity: t.isValid ? 1 : 0.6 }}>
                                                <td style={styles.td}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        {!t.isValid && <AlertCircle size={14} color="#ef4444" title={t.error} />}
                                                        {t.title || <span style={{ color: '#ef4444' }}>Missing</span>}
                                                    </div>
                                                </td>
                                                <td style={styles.td}>
                                                    <span style={{ color: t.project_id ? 'inherit' : '#ef4444' }}>{t.project_name || 'Missing'}</span>
                                                </td>
                                                <td style={styles.td}>
                                                    <span style={{ color: t.assigned_to ? 'inherit' : '#ef4444' }}>{t.member_name || 'Missing'}</span>
                                                </td>
                                                <td style={styles.td}><span style={styles.tag}>{t.priority}</span></td>
                                                <td style={styles.td}><span style={styles.tag}>{t.status}</span></td>
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
                            <h2>Tasks Imported!</h2>
                            <p>{importResults?.processed} tasks created successfully</p>
                            {importResults?.errors.length > 0 && (
                                <div style={styles.errorList}>
                                    {importResults.errors.map((e, i) => <div key={i} style={styles.errorItem}>{e.title}: {e.message}</div>)}
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
                            <button style={styles.saveButton} onClick={handleImport} disabled={loading || !importedData.some(t => t.isValid)}>
                                {loading ? <Loader2 className="animate-spin" /> : <ListChecks size={18} />} Import Tasks
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
    tag: { padding: '4px 8px', background: 'var(--bg-body)', borderRadius: '12px', fontSize: '11px', textTransform: 'capitalize' },
    modalFooter: { padding: '20px 30px', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'flex-end', gap: '12px' },
    cancelButton: { padding: '10px 20px', background: 'transparent', border: '1px solid var(--border-light)', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' },
    saveButton: { padding: '10px 20px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' },
    errorList: { marginTop: '20px', textAlign: 'left', background: '#fef2f2', padding: '15px', borderRadius: '12px' },
    errorItem: { fontSize: '12px', color: '#dc2626', marginBottom: '4px' }
};

export default ImportTasksModal;
