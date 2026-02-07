import React, { useState, useEffect, useRef } from 'react';
import { Bell, MessageSquare, CheckCircle, UserPlus, Activity, FileText } from 'lucide-react';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

const NotificationBell = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('recent');
    const [hasNew, setHasNew] = useState(false);
    const [lastReadTime, setLastReadTime] = useState(0);
    const [visitedIds, setVisitedIds] = useState(new Set());
    const dropdownRef = useRef(null);
    const { theme } = useTheme();

    // Get current user and panel context to namespace the storage keys
    const user = JSON.parse(localStorage.getItem('user'));
    const userId = user ? user.id : 'guest';
    const panel = window.location.pathname.split('/')[1] || 'default';

    const VISITED_KEY = `visitedActivityIds_${userId}_${panel}`;
    const LAST_CHECK_KEY = `lastActivityCheck_${userId}_${panel}`;

    // Load visited IDs from local storage
    useEffect(() => {
        const storedVisited = localStorage.getItem(VISITED_KEY);
        if (storedVisited) {
            setVisitedIds(new Set(JSON.parse(storedVisited)));
        }
    }, [VISITED_KEY]);

    const handleActivityClick = (activity) => {
        // Add to visited set
        const newVisitedIds = new Set(visitedIds);
        newVisitedIds.add(activity.id);
        setVisitedIds(newVisitedIds);
        localStorage.setItem(VISITED_KEY, JSON.stringify([...newVisitedIds]));

        if (activity.task_id) {
            const role = user?.role;
            if (role === 'manager') {
                window.location.href = `/manager/tasks/${activity.task_id}`;
            } else if (role === 'member') {
                window.location.href = `/member/tasks/${activity.task_id}`;
            }
            setIsOpen(false);
        }
    };

    const checkNewActivity = async () => {
        try {
            const response = await api.get('/api/activity/list.php?limit=1&scope=notifications');
            if (response.data && response.data.activities && response.data.activities.length > 0) {
                const latestActivity = new Date(response.data.activities[0].created_at).getTime();
                const lastChecked = localStorage.getItem(LAST_CHECK_KEY);
                // If no last checked, or latest activity is newer than last checked
                if (!lastChecked || latestActivity > new Date(lastChecked).getTime()) {
                    setHasNew(true);
                }
            }
        } catch (error) {
            // silent fail
        }
    };

    useEffect(() => {
        checkNewActivity();
        const interval = setInterval(checkNewActivity, 30000); // Check every 30s
        return () => clearInterval(interval);
    }, []);

    const fetchActivities = async () => {
        setLoading(true);
        try {
            // "Recent" -> 10, "All" -> 50 for now
            const limit = activeTab === 'recent' ? 10 : 50;
            const response = await api.get(`/api/activity/list.php?limit=${limit}&scope=notifications`);
            if (response.data && response.data.activities) {
                setActivities(response.data.activities);

                // When panel opens, we update lastReadTime, but that only makes items "Seen" (not "New").
                // User wants distinction between "Clicked" and "Not Clicked".

                if (isOpen) {
                    localStorage.setItem(LAST_CHECK_KEY, new Date().toISOString());
                    setHasNew(false);
                }
            }
        } catch (error) {
            console.error("Failed to fetch activities:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            // Snapshot the last read time for rendering logic
            const stored = localStorage.getItem(LAST_CHECK_KEY);
            setLastReadTime(stored ? new Date(stored).getTime() : 0);

            fetchActivities();
        }
    }, [isOpen, activeTab]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const timeAgo = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);

        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + "y ago";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + "mo ago";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + "d ago";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + "h ago";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + "m ago";
        return Math.floor(seconds) + "s ago"; // Handle just now
    };

    const getIcon = (action) => {
        switch (action) {
            case 'note_added': return <MessageSquare size={16} color={theme.mode === 'dark' ? '#60a5fa' : '#3b82f6'} />;
            case 'status_updated': return <CheckCircle size={16} color={theme.mode === 'dark' ? '#34d399' : '#10b981'} />;
            case 'assigned': return <UserPlus size={16} color={theme.mode === 'dark' ? '#a78bfa' : '#8b5cf6'} />;
            case 'upload': return <FileText size={16} color={theme.mode === 'dark' ? '#fbbf24' : '#f59e0b'} />;
            default: return <Activity size={16} color={theme.mode === 'dark' ? '#9ca3af' : '#6b7280'} />;
        }
    };

    const themeColor = theme.color === 'blue' ? '#3b82f6' :
        theme.color === 'purple' ? '#8b5cf6' :
            theme.color === 'green' ? '#10b981' : '#f59e0b';

    return (
        <div ref={dropdownRef} style={{ position: 'relative' }}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="btn-icon"
                style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '8px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'inherit',
                    position: 'relative',
                    transition: 'background 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = theme.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                title="Notifications & Activity"
            >
                <Bell size={20} />
                {hasNew && (
                    <span style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        width: '8px',
                        height: '8px',
                        backgroundColor: '#ef4444',
                        borderRadius: '50%',
                        border: `1.5px solid ${theme.mode === 'dark' ? '#111827' : '#ffffff'}`
                    }}></span>
                )}
            </button>

            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: '120%',
                    right: 0,
                    width: '380px',
                    maxWidth: '90vw',
                    backgroundColor: theme.mode === 'dark' ? '#1f2937' : '#ffffff',
                    border: `1px solid ${theme.mode === 'dark' ? '#374151' : '#e5e7eb'}`,
                    borderRadius: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                    zIndex: 1000,
                    overflow: 'hidden',
                    animation: 'fadeIn 0.2s ease-out'
                }}>
                    <div style={{
                        padding: '16px',
                        borderBottom: `1px solid ${theme.mode === 'dark' ? '#374151' : '#f3f4f6'}`,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Notifications</h3>
                        <div style={{ display: 'flex', background: theme.mode === 'dark' ? '#374151' : '#f3f4f6', padding: '2px', borderRadius: '6px' }}>
                            <button
                                onClick={() => setActiveTab('recent')}
                                style={{
                                    border: 'none',
                                    background: activeTab === 'recent' ? themeColor : 'transparent',
                                    color: activeTab === 'recent' ? '#fff' : 'inherit',
                                    padding: '4px 12px',
                                    borderRadius: '4px',
                                    fontSize: '12px',
                                    fontWeight: '500',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                Recent
                            </button>
                            <button
                                onClick={() => setActiveTab('all')}
                                style={{
                                    border: 'none',
                                    background: activeTab === 'all' ? themeColor : 'transparent',
                                    color: activeTab === 'all' ? '#fff' : 'inherit',
                                    padding: '4px 12px',
                                    borderRadius: '4px',
                                    fontSize: '12px',
                                    fontWeight: '500',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                All Activity
                            </button>
                        </div>
                    </div>

                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        {loading ? (
                            <div style={{ padding: '32px', textAlign: 'center', opacity: 0.6 }}>
                                <div className="spinner" style={{
                                    border: `2px solid ${theme.mode === 'dark' ? '#374151' : '#e5e7eb'}`,
                                    borderTop: `2px solid ${themeColor}`,
                                    borderRadius: '50%',
                                    width: '20px',
                                    height: '20px',
                                    animation: 'spin 1s linear infinite',
                                    margin: '0 auto 8px'
                                }}></div>
                                Loading activity...
                            </div>
                        ) : activities.length === 0 ? (
                            <div style={{ padding: '32px', textAlign: 'center', opacity: 0.5 }}>
                                <Activity size={32} style={{ marginBottom: '8px', opacity: 0.3 }} />
                                <p style={{ margin: 0, fontSize: '14px' }}>No activity found</p>
                            </div>
                        ) : (
                            <div>
                                {activities.map((activity, index) => {
                                    // Calculate if item is new based on the SNAPSHOT of the last check time, not the current one
                                    const createdTime = new Date(activity.created_at).getTime();
                                    const isNew = lastReadTime ? createdTime > lastReadTime : true;
                                    const isVisited = visitedIds.has(activity.id);

                                    return (
                                        <div key={activity.id || index}
                                            onClick={() => handleActivityClick(activity)}
                                            style={{
                                                padding: '12px 16px',
                                                borderBottom: `1px solid ${theme.mode === 'dark' ? '#374151' : '#f3f4f6'}`,
                                                display: 'flex',
                                                gap: '12px',
                                                alignItems: 'flex-start',
                                                transition: 'all 0.2s',
                                                cursor: 'pointer',

                                                // Background: Only tint "New" items
                                                backgroundColor: isNew
                                                    ? (theme.mode === 'dark' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.08)')
                                                    : 'transparent',

                                                position: 'relative',

                                                // Opacity: Visited = 0.5, Unclicked (Seen or New) = 1
                                                opacity: isVisited ? 0.5 : 1,

                                                // Filter: Visited = Grayscale
                                                filter: isVisited ? 'grayscale(0.6)' : 'none'
                                            }}
                                            onMouseOver={(e) => {
                                                e.currentTarget.style.background = theme.mode === 'dark' ? '#374151' : '#f9fafb';
                                                // Restore visibility on hover
                                                if (isVisited) {
                                                    e.currentTarget.style.opacity = '0.9';
                                                    e.currentTarget.style.filter = 'grayscale(0)';
                                                }
                                            }}
                                            onMouseOut={(e) => {
                                                // Restore original state
                                                if (isNew) {
                                                    e.currentTarget.style.background = theme.mode === 'dark' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.08)';
                                                } else {
                                                    e.currentTarget.style.background = 'transparent';
                                                }

                                                if (isVisited) {
                                                    e.currentTarget.style.opacity = '0.5';
                                                    e.currentTarget.style.filter = 'grayscale(0.6)';
                                                }
                                            }}
                                        >
                                            {isNew && (
                                                <div style={{
                                                    position: 'absolute',
                                                    left: '4px',
                                                    top: '50%',
                                                    transform: 'translateY(-50%)',
                                                    width: '4px',
                                                    height: '4px',
                                                    borderRadius: '50%',
                                                    backgroundColor: themeColor,
                                                    boxShadow: `0 0 4px ${themeColor}`
                                                }}></div>
                                            )}
                                            <div style={{
                                                padding: '8px',
                                                borderRadius: '50%',
                                                background: theme.mode === 'dark' ? 'rgba(255,255,255,0.05)' : '#f3f4f6',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                marginTop: '2px',
                                            }}>
                                                {getIcon(activity.action)}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <p style={{ margin: '0 0 4px 0', fontSize: '14px', lineHeight: '1.4', color: (isNew || !isVisited) ? 'inherit' : (theme.mode === 'dark' ? '#9ca3af' : '#6b7280') }}>
                                                    <span style={{ fontWeight: isNew ? '700' : '500' }}>{activity.user_name}</span>
                                                    {' '}{activity.description.replace(activity.user_name, '')}
                                                    {activity.task_title && (
                                                        <span style={{ opacity: 0.8 }}> on task <span style={{ color: (isNew || !isVisited) ? themeColor : 'inherit', fontWeight: '500' }}>{activity.task_title}</span></span>
                                                    )}
                                                </p>
                                                <p style={{ margin: 0, fontSize: '11px', opacity: 0.5 }}>
                                                    {timeAgo(activity.created_at)}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                    {/* Optional Footer: Mark all read */}
                </div>
            )}
            <style>{`
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
};

export default NotificationBell;
