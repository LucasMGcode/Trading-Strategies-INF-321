import { useState, useEffect, useCallback } from 'react';
import { apiService } from '@/services/api';
import axios from 'axios';

export interface Strategy {
    id: string;
    name: string;
    summary?: string;
    description?: string;
    proficiencyLevel: string;
    marketOutlook: string;
    volatilityView: string;
    riskProfile: string;
    rewardProfile: string;
    strategyType: string;
    createdAt: string;
    updatedAt: string;
}

export interface StrategyFilters {
    proficiencyLevel?: string;
    marketOutlook?: string;
    volatilityView?: string;
    riskProfile?: string;
    rewardProfile?: string;
    strategyType?: string;
}

export const useStrategies = (filters: StrategyFilters = {}) => {
    const [strategies, setStrategies] = useState<Strategy[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchStrategies = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await apiService.getStrategies(filters);
            setStrategies(response.data);
        } catch (err: unknown) {
            const errorMessage =
                axios.isAxiosError(err)
                    ? (err.response?.data as { message?: string })?.message || 'Erro ao buscar estratégias'
                    : 'Erro ao buscar estratégias';

            setError(errorMessage);
            console.error('Erro ao buscar estratégias:', err);
        }
        finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchStrategies();
    }, [fetchStrategies]);

    return {
        strategies,
        loading,
        error,
        refetch: fetchStrategies,
    };
};

export const useStrategy = (id: string) => {
    const [strategy, setStrategy] = useState<Strategy & { legs: unknown[] } | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchStrategy = async () => {
            try {
                setLoading(true);
                setError(null);

                const response = await apiService.getStrategy(id);
                setStrategy(response.data);
            } catch (err: unknown) {
                const errorMessage =
                    axios.isAxiosError(err)
                        ? (err.response?.data as { message?: string })?.message || 'Erro ao buscar estratégia'
                        : 'Erro ao buscar estratégia';

                setError(errorMessage);
                console.error('Erro ao buscar estratégia:', err);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchStrategy();
        }
    }, [id]);

    return {
        strategy,
        loading,
        error,
    };
};