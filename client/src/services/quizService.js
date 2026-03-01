// client/src/services/quizService.js
import axios from 'axios';

// Create an Axios instance with a base URL and credentials
const API = axios.create({
    baseURL: import.meta.env.VITE_API_URL ?? '',
    // CRITICAL FIX: This sends cookies with every request
    withCredentials: true,
});

/**
 * Fetches quizzes based on query parameters.
 */
export const getQuizzes = async (searchQuery = '') => {
    const path = searchQuery ? `/api/v1/quizzes?${searchQuery}` : '/api/v1/quizzes';
    const { data } = await API.get(path);
    return data;
};

/**
 * Fetches a single quiz by its slug.
 */
export const getSingleQuizBySlug = async (quizSlug) => {
    // Use the configured API instance
    const { data } = await API.get(`/api/v1/quizzes/slug/${quizSlug}`);
    return data;
};

/**
 * Fetches a single quiz by its ID.
 */
export const getSingleQuizById = async (quizId) => {
    // Use the configured API instance
    const { data } = await API.get(`/api/v1/quizzes/${quizId}`);
    return data;
};

/**
 * Creates a new quiz.
 */
export const createQuiz = async (formData) => {
    // Use the configured API instance
    const { data } = await API.post('/api/v1/quizzes', formData);
    return data;
};

/**
 * Updates an existing quiz.
 */
export const updateQuiz = async ({ quizId, formData }) => {
    // Use the configured API instance
    const { data } = await API.put(`/api/v1/quizzes/${quizId}`, formData);
    return data;
};

/**
 * Deletes a quiz.
 */
export const deleteQuiz = async ({ quizId }) => {
    // Use the configured API instance
    const { data } = await API.delete(`/api/v1/quizzes/${quizId}`);
    return data;
};

/**
 * Submits quiz answers for grading.
 */
export const submitQuiz = async (quizId, answers) => {
    // Use the configured API instance
    const { data } = await API.post(`/api/v1/quizzes/submit/${quizId}`, { answers });
    return data;
};
