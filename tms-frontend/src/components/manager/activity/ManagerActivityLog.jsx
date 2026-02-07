import React, { useState, useEffect } from 'react';
import {
    Activity,
    Filter,
    Search,
    Calendar,
    User,
    CheckSquare,
    MessageSquare,
    Paperclip,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
    TrendingUp,
    Clock,
    AlertCircle,
    Folder
} from 'lucide-react';
import activityService from '../../../services/activityService';

const ManagerActivityLog = () => {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({
        total: 0,
        limit: 50,
        offset: 0,
        has_more: false
    });

    // Filters
    const [filters, setFilters] = useState({
        search: '',
        action_type: '',
        entity_type: '',
        date_from: '',
        date_to: '',
        scope: 'all'
    });

    const [stats, setStats] = useState({
        today: 0,
        this_week: 0,
        this_month: 0
    });

    useEffect(() => {
        fetchActivities();
    }, [pagination.offset, filters]);

    const fetchActivities = async () => {
        try {
            setLoading(true);
            setError(null);

            const params = {
                limit: pagination.limit,
                offset: pagination.offset,
                ...filters
            };

            // Remove empty filters
            Object.keys(params).forEach(key => {
                if (params[key] === '' || params[key] === null) {
                    delete params[key];
                }
            });

            const data = await activityService.getActivities(params);

            setActivities(data.activities || []);
            setPagination(prev => ({
                ...prev,
                ...data.pagination
            }));

            // Calculate simple stats from current data
            calculateStats(data.activities || []);

        } catch (err) {
            console.error('Error fetching activities:', err);
            setError('Failed to load activity logs. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (activities) => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

        const stats = {
            today: 0,
            this_week: 0,
            this_month: 0
        };

        activities.forEach(activity => {
            const activityDate = new Date(activity.created_at);
            if (activityDate >= today) stats.today++;
            if (activityDate >= weekAgo) stats.this_week++;
            if (activityDate >= monthAgo) stats.this_month++;
        });

        setStats(stats);
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({
            ...prev,
            [key]: value
        }));
        setPagination(prev => ({ ...prev, offset: 0 })); // Reset to first page
    };

    const handleSearch = (e) => {
        const value = e.target.value;
        setFilters(prev => ({
            ...prev,
            search: value
        }));
        setPagination(prev => ({ ...prev, offset: 0 }));
    };

    const clearFilters = () => {
        setFilters({
            search: '',
            action_type: '',
            entity_type: '',
            date_from: '',
            date_to: '',
            scope: 'all'
        });
        setPagination(prev => ({ ...prev, offset: 0 }));
    };

    const nextPage = () => {
        if (pagination.has_more) {
            setPagination(prev => ({
                ...prev,
                offset: prev.offset + prev.limit
            }));
        }
    };

    const prevPage = () => {
        if (pagination.offset > 0) {
            setPagination(prev => ({
                ...prev,
                offset: Math.max(0, prev.offset - prev.limit)
            }));
        }
    };

    const getActionIcon = (actionType) => {
        const iconMap = {
            project_created: <Folder size={16} />,
            project_updated: <Folder size={16} />,
            project_status_changed: <Folder size={16} />,
            task_created: <CheckSquare size={16} />,
            task_updated: <CheckSquare size={16} />,
            task_assigned: <CheckSquare size={16} />,
            task_status_changed: <CheckSquare size={16} />,
            task_comment_added: <MessageSquare size={16} />,
            task_attachment_added: <Paperclip size={16} />,
            login: <User size={16} />,
            password_changed: <User size={16} />
        };
        return iconMap[actionType] || <Activity size={16} />;
    };

    const getActionColor = (actionType) => {
        if (actionType.includes('created')) return '#10b981'; // Success green
        if (actionType.includes('deleted')) return '#ef4444'; // Danger red
        if (actionType.includes('updated') || actionType.includes('changed')) return '#f59e0b'; // Warning orange
        if (actionType.includes('assigned')) return '#3b82f6'; // Info blue
        return '#3b82f6'; // Primary blue
    };

    const formatRelativeTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffSecs = Math.floor(diffMs / 1000);
        const diffMins = Math.floor(diffSecs / 60);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffSecs < 60) return 'Just now';
        if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        });
    };

    const formatActionType = (actionType) => {
        return actionType
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    const currentPage = Math.floor(pagination.offset / pagination.limit) + 1;
    const totalPages = Math.ceil(pagination.total / pagination.limit);

    return (
        <div style={styles.container}>
            {/* Header */}
            <div style={styles.header}>
                <div>
                    <h1 style={styles.title}>Project Activity Log</h1>
                    <p style={styles.subtitle}>Monitor activities across your assigned projects</p>
                </div>
                <div style={styles.headerActions}>
                    <button style={styles.createButton} onClick={fetchActivities}>
                        <RefreshCw size={18} /> <span>Refresh</span>
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div style={styles.statsGrid}>
                <div style={{ ...styles.statCard, background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' }}>
                    <Clock size={24} style={{ opacity: 0.9, marginBottom: 12 }} />
                    <div style={styles.statNumber}>{stats.today}</div>
                    <div style={styles.statLabel}>Today's Activities</div>
                </div>
                <div style={{ ...styles.statCard, background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
                    <TrendingUp size={24} style={{ opacity: 0.9, marginBottom: 12 }} />
                    <div style={styles.statNumber}>{stats.this_week}</div>
                    <div style={styles.statLabel}>This Week</div>
                </div>
                <div style={{ ...styles.statCard, background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' }}>
                    <Calendar size={24} style={{ opacity: 0.9, marginBottom: 12 }} />
                    <div style={styles.statNumber}>{stats.this_month}</div>
                    <div style={styles.statLabel}>This Month</div>
                </div>
            </div>

            {/* Filters */}
            <div style={styles.filtersContainer}>
                <div style={styles.searchBox}>
                    <Search style={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder="Search activities..."
                        value={filters.search}
                        onChange={handleSearch}
                        style={styles.searchInput}
                    />
                </div>

                <div style={styles.filterGroup}>
                    <select
                        value={filters.action_type}
                        onChange={(e) => handleFilterChange('action_type', e.target.value)}
                        style={styles.filterSelect}
                    >
                        <option value="">All Actions</option>
                        <option value="project_created">Project Created</option>
                        <option value="project_updated">Project Updated</option>
                        <option value="project_status_changed">Project Status Changed</option>
                        <option value="task_created">Task Created</option>
                        <option value="task_updated">Task Updated</option>
                        <option value="task_assigned">Task Assigned</option>
                        <option value="task_status_changed">Task Status Changed</option>
                        <option value="task_comment_added">Comment Added</option>
                        <option value="task_attachment_added">Attachment Added</option>
                    </select>
                </div>

                <div style={styles.filterGroup}>
                    <select
                        value={filters.entity_type}
                        onChange={(e) => handleFilterChange('entity_type', e.target.value)}
                        style={styles.filterSelect}
                    >
                        <option value="">All Entities</option>
                        <option value="project">Project</option>
                        <option value="task">Task</option>
                    </select>
                </div>

                <div style={styles.filterGroup}>
                    <input
                        type="date"
                        value={filters.date_from}
                        onChange={(e) => handleFilterChange('date_from', e.target.value)}
                        style={styles.filterSelect}
                        placeholder="From Date"
                    />
                </div>
                <div style={styles.filterGroup}>
                    <input
                        type="date"
                        value={filters.date_to}
                        onChange={(e) => handleFilterChange('date_to', e.target.value)}
                        style={styles.filterSelect}
                        placeholder="To Date"
                    />
                </div>

                <div style={styles.filterGroup}>
                    <select
                        value={filters.scope}
                        onChange={(e) => handleFilterChange('scope', e.target.value)}
                        style={{ ...styles.filterSelect, fontWeight: '600', color: 'var(--primary)', borderColor: 'var(--primary)' }}
                    >
                        <option value="all">Full Team Activity</option>
                        <option value="me">My Actions Only</option>
                    </select>
                </div>

                <button style={styles.resetButton} onClick={clearFilters}>Reset Filters</button>
            </div>

            {/* Activity List */}
            <div style={styles.activityList}>
                {loading && activities.length === 0 ? (
                    <div style={styles.loading}>
                        <div style={styles.spinner}></div>
                        <p>Loading activities...</p>
                    </div>
                ) : error ? (
                    <div style={styles.emptyState}>
                        <AlertCircle size={48} style={{ color: '#ef4444', marginBottom: 16 }} />
                        <h3 style={{ color: '#ef4444' }}>{error}</h3>
                        <button style={styles.createButtonSmall} onClick={fetchActivities}>Try Again</button>
                    </div>
                ) : activities.length === 0 ? (
                    <div style={styles.emptyState}>
                        <Activity size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
                        <h3>No Activities Found</h3>
                        <p>There are no activities matching your filters.</p>
                        <button style={styles.resetButton} onClick={clearFilters}>Clear Filters</button>
                    </div>
                ) : (
                    activities.map((activity) => (
                        <div key={activity.id} style={styles.activityCard}>
                            <div style={{
                                ...styles.activityIconWrapper,
                                background: getActionColor(activity.action_type) + '20',
                                color: getActionColor(activity.action_type)
                            }}>
                                {getActionIcon(activity.action_type)}
                            </div>

                            <div style={styles.activityContent}>
                                <div style={styles.activityHeader}>
                                    <div style={styles.activityDescription}>
                                        <span style={styles.userName}>{activity.user_name || 'Unknown User'}</span>
                                        <span style={styles.descriptionText}>{activity.description}</span>
                                    </div>
                                    <div style={styles.activityMeta}>
                                        <span style={styles.timeTag}>
                                            <Clock size={12} />
                                            {formatRelativeTime(activity.created_at)}
                                        </span>
                                        <span style={{
                                            ...styles.typeBadge,
                                            background: getActionColor(activity.action_type) + '20',
                                            color: getActionColor(activity.action_type)
                                        }}>
                                            {formatActionType(activity.action_type)}
                                        </span>
                                    </div>
                                </div>

                                {(activity.old_value || activity.new_value) && (
                                    <div style={styles.changesContainer}>
                                        {activity.old_value && (
                                            <div style={styles.changeItem}>
                                                <span style={{ color: '#ef4444', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>From:</span> {activity.old_value}
                                            </div>
                                        )}
                                        {activity.new_value && (
                                            <div style={styles.changeItem}>
                                                <span style={{ color: '#10b981', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>To:</span> {activity.new_value}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Pagination */}
            {pagination.total > pagination.limit && (
                <div style={styles.pagination}>
                    <button style={styles.pageButton} onClick={prevPage} disabled={pagination.offset === 0}>
                        <ChevronLeft size={16} />
                    </button>
                    <span style={styles.pageInfo}>
                        Showing {pagination.offset + 1} - {Math.min(pagination.offset + pagination.limit, pagination.total)} of {pagination.total}
                    </span>
                    <button style={styles.pageButton} onClick={nextPage} disabled={!pagination.has_more}>
                        <ChevronRight size={16} />
                    </button>
                </div>
            )}
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
    );
};

const styles = {
    container: { padding: '20px', minHeight: '100vh', boxSizing: 'border-box' },
    header: { display: 'flex', justifyContent: 'space-between', marginBottom: '30px', flexWrap: 'wrap', gap: '20px', alignItems: 'center' },
    title: { fontSize: '28px', fontWeight: '800', margin: '0 0 8px 0', background: 'linear-gradient(135deg, var(--primary), var(--accent))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
    subtitle: { color: 'var(--text-secondary)', fontSize: '15px', margin: 0 },
    headerActions: { display: 'flex', gap: '12px' },
    createButton: { display: 'flex', gap: '6px', padding: '10px 20px', background: 'var(--primary)', border: 'none', borderRadius: '8px', color: 'white', fontWeight: '600', cursor: 'pointer', alignItems: 'center', whiteSpace: 'nowrap' },
    createButtonSmall: { display: 'flex', gap: '6px', padding: '6px 12px', background: 'var(--primary)', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', margin: '16px auto' },

    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' },
    statCard: { padding: '24px', borderRadius: '16px', color: '#fff', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' },
    statNumber: { fontSize: '32px', fontWeight: '700', marginBottom: '8px' },
    statLabel: { fontSize: '14px', opacity: 0.9 },

    filtersContainer: { display: 'flex', gap: '15px', marginBottom: '30px', flexWrap: 'wrap', padding: '20px', background: 'white', borderRadius: '16px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-light)' },
    searchBox: { flex: 1, position: 'relative', minWidth: '250px' },
    searchIcon: { position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' },
    searchInput: { width: '100%', padding: '12px 20px 12px 45px', borderRadius: '10px', border: '1px solid var(--border-light)', outline: 'none' },
    filterGroup: { display: 'flex', gap: '8px' },
    filterSelect: { padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-light)', outline: 'none', minWidth: '140px', background: 'white' },
    resetButton: { padding: '10px 16px', background: 'var(--bg-body)', border: '1px solid var(--border-light)', borderRadius: '10px', cursor: 'pointer' },

    activityList: { display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '30px' },
    activityCard: { background: 'white', borderRadius: '16px', padding: '20px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-light)', display: 'flex', gap: '20px', alignItems: 'flex-start' },

    activityIconWrapper: { width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    activityContent: { flex: 1, minWidth: 0 },
    activityHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' },
    activityDescription: { flex: 1, minWidth: '200px' },
    userName: { fontWeight: '700', color: 'var(--primary)', marginRight: '8px' },
    descriptionText: { color: 'var(--text-primary)', lineHeight: '1.5' },
    activityMeta: { display: 'flex', alignItems: 'center', gap: '12px' },
    timeTag: { display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--text-secondary)' },
    typeBadge: { padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase' },

    changesContainer: { background: 'var(--bg-body)', borderRadius: '8px', padding: '12px', marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' },
    changeItem: { fontSize: '13px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' },

    loading: { padding: '100px', textAlign: 'center', color: 'var(--text-muted)', width: '100%' },
    spinner: { width: '40px', height: '40px', border: '3px solid var(--bg-body)', borderTop: '3px solid var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 20px' },
    emptyState: { padding: '80px', textAlign: 'center', color: 'var(--text-muted)', width: '100%' },
    pagination: { display: 'flex', justifyContent: 'center', padding: '20px', gap: '8px', alignItems: 'center' },
    pageButton: { padding: '8px', background: 'transparent', border: '1px solid var(--border-light)', borderRadius: '8px', cursor: 'pointer', display: 'flex' },
    pageInfo: { display: 'flex', alignItems: 'center', color: 'var(--text-secondary)' }
};

export default ManagerActivityLog;
