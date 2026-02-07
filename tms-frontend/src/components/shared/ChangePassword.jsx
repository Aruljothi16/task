import React, { useState } from 'react';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import { Shield, Key, Lock, CheckCircle2 } from 'lucide-react';

const ChangePassword = () => {
    const { addToast } = useToast();
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        current_password: '',
        new_password: '',
        confirm_password: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.new_password !== formData.confirm_password) {
            addToast('New passwords do not match', 'error');
            return;
        }

        if (formData.new_password.length < 6) {
            addToast('Password must be at least 6 characters long', 'error');
            return;
        }

        setSaving(true);
        try {
            const response = await api.post('/api/auth/change_password.php',
                {
                    current_password: formData.current_password,
                    new_password: formData.new_password
                }
            );

            addToast(response.data.message, 'success');
            setFormData({
                current_password: '',
                new_password: '',
                confirm_password: ''
            });
        } catch (error) {
            addToast(error.response?.data?.message || 'Failed to change password', 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="card glass-panel" style={{ padding: '2rem', height: '100%', border: '1px solid var(--border-glass)' }}>
            <div className="card-header" style={{ marginBottom: '2rem', border: 'none', padding: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: 'rgba(67, 97, 238, 0.1)',
                    color: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '1rem'
                }}>
                    <Shield size={24} />
                </div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                    Security
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    Ensure your account stays safe by updating your password periodically.
                </p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Key size={14} /> Current Password
                    </label>
                    <div style={{ position: 'relative' }}>
                        <input
                            type="password"
                            name="current_password"
                            className="form-control"
                            style={{ paddingLeft: '2.5rem', background: 'var(--bg-body)', borderColor: 'var(--border-light)' }}
                            value={formData.current_password}
                            onChange={handleChange}
                            required
                            placeholder="Type current password"
                        />
                        <Lock size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Lock size={14} /> New Password
                    </label>
                    <div style={{ position: 'relative' }}>
                        <input
                            type="password"
                            name="new_password"
                            className="form-control"
                            style={{ paddingLeft: '2.5rem', background: 'var(--bg-body)', borderColor: 'var(--border-light)' }}
                            value={formData.new_password}
                            onChange={handleChange}
                            required
                            placeholder="Min. 6 characters"
                        />
                        <Lock size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CheckCircle2 size={14} /> Confirm Password
                    </label>
                    <div style={{ position: 'relative' }}>
                        <input
                            type="password"
                            name="confirm_password"
                            className="form-control"
                            style={{ paddingLeft: '2.5rem', background: 'var(--bg-body)', borderColor: 'var(--border-light)' }}
                            value={formData.confirm_password}
                            onChange={handleChange}
                            required
                            placeholder="Repeat new password"
                        />
                        <Lock size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    </div>
                </div>

                <div style={{ marginTop: '1rem' }}>
                    <button
                        type="submit"
                        className="btn"
                        style={{
                            background: 'var(--primary)',
                            color: 'white',
                            width: '100%',
                            padding: '1rem',
                            justifyContent: 'center',
                            fontSize: '1rem',
                            fontWeight: 600,
                            boxShadow: '0 4px 14px 0 rgba(67, 97, 238, 0.39)'
                        }}
                        disabled={saving}
                    >
                        {saving ? 'Updating...' : 'Update Security'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ChangePassword;
