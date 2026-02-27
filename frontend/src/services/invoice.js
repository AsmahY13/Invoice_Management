// src/services/invoice.js
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const invoiceService = {
    // Get dashboard statistics
    getStats: async () => {
        try {
            const token = localStorage.getItem('token'); // or however you store auth token
            const response = await fetch(`${API_BASE}/invoices/stats`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch stats');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error fetching stats:', error);
            throw error;
        }
    },

    // Get recent activity
    getRecentActivity: async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE}/invoices/recent-activity`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch activity');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error fetching activity:', error);
            throw error;
        }
    },

    // Get all invoices (if needed elsewhere)
    getAll: async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE}/invoices`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch invoices');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error fetching invoices:', error);
            throw error;
        }
    }
};

export default invoiceService;