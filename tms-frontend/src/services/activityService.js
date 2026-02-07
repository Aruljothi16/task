import api from './api';

/**
 * Activity Service
 * Handles all activity log related API calls
 */

export const activityService = {
    /**
     * Get activity logs with optional filters
     * @param {Object} params - Query parameters
     * @param {number} params.limit - Number of records to fetch
     * @param {number} params.offset - Offset for pagination
     * @param {string} params.action_type - Filter by action type
     * @param {string} params.entity_type - Filter by entity type
     * @param {string} params.date_from - Filter from date (YYYY-MM-DD)
     * @param {string} params.date_to - Filter to date (YYYY-MM-DD)
     * @param {string} params.search - Search term
     */
    getActivities: async (params = {}) => {
        const queryParams = new URLSearchParams();

        if (params.limit) queryParams.append('limit', params.limit);
        if (params.offset) queryParams.append('offset', params.offset);
        if (params.action_type) queryParams.append('action_type', params.action_type);
        if (params.entity_type) queryParams.append('entity_type', params.entity_type);
        if (params.date_from) queryParams.append('date_from', params.date_from);
        if (params.date_to) queryParams.append('date_to', params.date_to);
        if (params.search) queryParams.append('search', params.search);
        if (params.scope) queryParams.append('scope', params.scope);

        const url = `/api/activity/list.php${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
        const response = await api.get(url);
        return response.data;
    },

    /**
     * Get activity statistics
     */
    getActivityStats: async () => {
        try {
            const response = await api.get('/api/activity/stats.php');
            return response.data;
        } catch (error) {
            console.error('Error fetching activity stats:', error);
            throw error;
        }
    },
};

export default activityService;
