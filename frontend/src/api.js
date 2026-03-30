import axios from 'axios';

const API_URL = 'http://localhost:8000';

export const login = async (username, password) => {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);
    const res = await axios.post(`${API_URL}/token`, formData);
    if(res.data.access_token) {
        localStorage.setItem('token', res.data.access_token);
        localStorage.setItem('role', res.data.role);
        localStorage.setItem('factory_id', res.data.factory_id || '');
    }
    return res.data;
};

export const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('factory_id');
};

const authHeader = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
});

export const getFactories = async () => {
    const res = await axios.get(`${API_URL}/factories/`, authHeader());
    return res.data;
};

export const getFactory = async (id) => {
    const res = await axios.get(`${API_URL}/factories/${id}`, authHeader());
    return res.data;
};

export const getSensorData = async (factoryId, limit = 60) => {
    const res = await axios.get(`${API_URL}/factories/${factoryId}/sensors?limit=${limit}`, authHeader());
    return res.data;
};

export const getAlerts = async (limit = 100) => {
    const res = await axios.get(`${API_URL}/alerts/?limit=${limit}`, authHeader());
    return res.data;
};

export const resolveAlert = async (alertId) => {
    const res = await axios.post(`${API_URL}/alerts/${alertId}/resolve`, {}, authHeader());
    return res.data;
};
