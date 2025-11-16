import { useState, useEffect, useCallback } from 'react';
import { apiService } from '@/services/api';

export interface User {
    id: string;
    username: string;
    email: string;
    experienceLevel: string;
    createdAt: string;
    updatedAt: string;
}

export const useAuth = () => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const token = localStorage.getItem('accessToken');
                if (!token) {
                    setLoading(false);
                    return;
                }

                const response = await apiService.getCurrentUser();
                setUser(response.data);
                setError(null);
            } catch (err) {
                console.error('Erro ao verificar autenticação:', err);
                localStorage.removeItem('accessToken');
                setUser(null);
                setError('Falha ao verificar autenticação');
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        try {
            setLoading(true);
            setError(null);

            const response = await apiService.login({ email, password });
            const { user, accessToken } = response.data;

            localStorage.setItem('accessToken', accessToken);

            setUser(user);
            return user;
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || 'Erro ao fazer login';
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const register = useCallback(
        async (username: string, email: string, password: string, experienceLevel?: string) => {
            try {
                setLoading(true);
                setError(null);

                const response = await apiService.register({
                    username,
                    email,
                    password,
                    experienceLevel,
                });

                const { user, accessToken } = response.data;

                localStorage.setItem('accessToken', accessToken);

                setUser(user);
                return user;
            } catch (err: any) {
                const errorMessage = err.response?.data?.message || 'Erro ao registrar';
                setError(errorMessage);
                throw err;
            } finally {
                setLoading(false);
            }
        },
        []
    );

    const logout = useCallback(async () => {
        try {
            await apiService.logout();
        } catch (err) {
            console.error('Erro ao fazer logout:', err);
        } finally {
            localStorage.removeItem('accessToken');
            setUser(null);
        }
    }, []);

    const isAuthenticated = !!user;

    return {
        user,
        loading,
        error,
        isAuthenticated,
        login,
        register,
        logout,
    };
};