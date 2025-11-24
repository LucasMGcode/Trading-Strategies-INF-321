import axios, { AxiosInstance, AxiosError } from 'axios';

const API_URL = 'http://localhost:3001/api';

class ApiService {
    private api: AxiosInstance;

    constructor() {
        this.api = axios.create({
            baseURL: API_URL,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // Interceptor para adicionar token de autenticação
        this.api.interceptors.request.use((config) => {
            const token = localStorage.getItem('accessToken');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        });

        // Interceptor para tratar erros
        this.api.interceptors.response.use(
            (response) => response,
            (error: AxiosError) => {
                if (error.response?.status === 401) {
                    // Token expirado ou inválido
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('refreshToken');
                    window.location.href = '/login';
                }
                return Promise.reject(error);
            }
        );
    }

    // Auth endpoints
    async register(data: {
        username: string;
        email: string;
        password: string;
        experienceLevel?: string;
    }) {
        return this.api.post('/auth/register', data);
    }

    async login(data: { email: string; password: string }) {
        return this.api.post('/auth/login', data);
    }

    async getCurrentUser() {
        return this.api.get('/auth/me');
    }

    async logout() {
        return this.api.post('/auth/logout');
    }

    async changePassword(data: {
        currentPassword: string;
        newPassword: string;
    }) {
        return this.api.post('/auth/change-password', data);
    }

    // Strategies endpoints
    async getStrategies(filters?: {
        proficiencyLevel?: string;
        marketOutlook?: string;
        volatilityView?: string;
        riskProfile?: string;
        rewardProfile?: string;
        strategyType?: string;
    }) {
        return this.api.get('/strategies', { params: filters });
    }

    async getStrategy(id: string) {
        return this.api.get(`/strategies/${id}`);
    }

    async createStrategy(data: unknown) {
        return this.api.post('/strategies', data);
    }

    async updateStrategy(id: string, data: unknown) {
        return this.api.patch(`/strategies/${id}`, data);
    }

    async deleteStrategy(id: string) {
        return this.api.delete(`/strategies/${id}`);
    }

    // Simulations endpoints
    async getUserSimulations(userId: string, options?: {
        limit?: number;
        offset?: number;
        orderBy?: string;
    }) {
        return this.api.get(`/simulations/user/${userId}`, { params: options });
    }

    async getSimulation(id: string) {
        return this.api.get(`/simulations/${id}`);
    }

    async createSimulation(data: unknown) {
        return this.api.post('/simulations', data);
    }

    async updateSimulation(id: string, data: unknown) {
        return this.api.patch(`/simulations/${id}`, data);
    }

    async deleteSimulation(id: string) {
        return this.api.delete(`/simulations/${id}`);
    }

    async getUserStatistics(userId: string) {
        return this.api.get(`/simulations/user/${userId}/statistics`);
    }

    // Users endpoints
    async getUserProfile(userId: string) {
        return this.api.get(`/users/${userId}/profile`);
    }

    async updateUserProfile(userId: string, data: unknown) {
        return this.api.patch(`/users/${userId}/profile`, data);
    }

    async deleteUser(userId: string) {
        return this.api.delete(`/users/${userId}`);
    }

    async getUserExists(userId: string) {
        return this.api.get(`/users/${userId}/exists`);
    }
}

export const apiService = new ApiService();