import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import { User, Mail, Calendar, Save, AtSign } from 'lucide-react';

const ProfileSettings = () => {
    const { user, updateUser } = useAuth();
    const { addToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        full_name: '',
        role: '',
        created_at: ''
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await api.get('/api/auth/profile.php');
            setFormData(response.data);
            setLoading(false);
        } catch (error) {
            addToast('Failed to fetch profile data', 'error');
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const response = await api.post('/api/auth/profile.php',
                {
                    full_name: formData.full_name,
                    email: formData.email,
                    username: formData.username
                }
            );

            addToast(response.data.message, 'success');

            // Update user context
            updateUser({
                full_name: formData.full_name,
                email: formData.email,
                username: formData.username
            });

        } catch (error) {
            addToast(error.response?.data?.message || 'Failed to update profile', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="loading" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading profile...</div>;

    return (
        <div className="card glass-panel" style={{ padding: '2rem', height: '100%', border: '1px solid var(--border-glass)' }}>
            <div className="card-header" style={{ marginBottom: '2rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.5rem',
                        fontWeight: 700,
                        boxShadow: 'var(--shadow-md)'
                    }}>
                        {formData.full_name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                            My Profile
                        </h2>
                        <span className="badge" style={{
                            background: 'var(--bg-body)',
                            color: 'var(--primary)',
                            border: '1px solid var(--border-light)',
                            padding: '4px 12px',
                            fontSize: '0.75rem'
                        }}>
                            {formData.role?.toUpperCase()}
                        </span>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div className="stats-grid" style={{ gridTemplateColumns: 'minmax(250px, 1fr) minmax(250px, 1fr)', gap: '2rem', marginBottom: 0 }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <AtSign size={14} /> Username
                        </label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type="text"
                                name="username"
                                className="form-control"
                                style={{ paddingLeft: '2.5rem', background: 'var(--bg-body)' }}
                                value={formData.username}
                                onChange={handleChange}
                                required
                            />
                            <User size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        </div>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Mail size={14} /> Email Address
                        </label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type="email"
                                name="email"
                                className="form-control"
                                style={{ paddingLeft: '2.5rem', background: 'var(--bg-body)' }}
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                            <Mail size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        </div>
                    </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <User size={14} /> Full Name
                    </label>
                    <div style={{ position: 'relative' }}>
                        <input
                            type="text"
                            name="full_name"
                            className="form-control"
                            style={{ paddingLeft: '2.5rem', background: 'var(--bg-body)', fontSize: '1.1rem', fontWeight: 500 }}
                            value={formData.full_name}
                            onChange={handleChange}
                            required
                        />
                        <User size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Calendar size={14} /> Account Created
                    </label>
                    <div style={{ position: 'relative' }}>
                        <input
                            type="text"
                            className="form-control"
                            value={new Date(formData.created_at).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                            disabled
                            style={{ opacity: 0.7, cursor: 'not-allowed', paddingLeft: '2.5rem', background: 'var(--bg-body)' }}
                        />
                        <Calendar size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    </div>
                </div>

                <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-light)', paddingTop: '1.5rem' }}>
                    <button type="submit" className="btn btn-primary" disabled={saving} style={{ paddingLeft: '2rem', paddingRight: '2rem' }}>
                        <Save size={18} /> {saving ? 'Saving Changes...' : 'Save Profile Changes'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ProfileSettings;
