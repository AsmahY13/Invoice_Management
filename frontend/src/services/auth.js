import axios from 'axios';

// Use environment variable with fallback to localhost for development
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

class AuthService {
    async login(username, password) {
        const formData = new FormData();
        formData.append('username', username);
        formData.append('password', password);
        
        try {
            const response = await axios.post(`${API_URL}/token`, formData);
            if (response.data.access_token) {
                localStorage.setItem('token', response.data.access_token);
                localStorage.setItem('username', username);
                
                // Decode token to get user info (optional - we'll get from backend)
                await this.getUserInfo();
            }
            return response.data;
        } catch (error) {
            throw error;
        }
    }
    
    async getUserInfo() {
    try {
        const response = await axios.get(`${API_URL}/users/me`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        localStorage.setItem('userRole', response.data.role);
        localStorage.setItem('userId', response.data.id);
        localStorage.setItem('userEmail', response.data.email);
        console.log('✅ User info saved:', response.data);
        return response.data;
    } catch (error) {
        console.error('❌ Error getting user info:', error);
    }
}
    
    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userId');
    }
    
    getCurrentUser() {
        return {
            username: localStorage.getItem('username'),
            role: localStorage.getItem('userRole'),
            token: localStorage.getItem('token')
        };
    }
    
    isAuthenticated() {
        return !!localStorage.getItem('token');
    }
    
    getAuthHeader() {
        const token = localStorage.getItem('token');
        return token ? { 'Authorization': `Bearer ${token}` } : {};
    }
}

export default new AuthService();