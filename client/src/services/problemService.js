// client/src/services/problemService.js
import axios from 'axios';

const API = axios.create({
    baseURL: import.meta.env.VITE_API_URL ?? '',
    withCredentials: true,
});

export const getProblems = async (searchQuery = '') => {
    const { data } = await API.get(`/api/v1/problems?${searchQuery}`);
    return data;
};

export const getProblemBySlug = async (problemSlug) => {
    const { data } = await API.get(`/api/v1/problems/slug/${problemSlug}`);
    return data;
};

export const getProblemById = async (problemId) => {
    const { data } = await API.get(`/api/v1/problems/${problemId}`);
    return data;
};

export const createProblem = async (payload) => {
    const { data } = await API.post('/api/v1/problems', payload);
    return data;
};

export const updateProblem = async ({ problemId, payload }) => {
    const { data } = await API.put(`/api/v1/problems/${problemId}`, payload);
    return data;
};

export const deleteProblem = async ({ problemId }) => {
    const { data } = await API.delete(`/api/v1/problems/${problemId}`);
    return data;
};
