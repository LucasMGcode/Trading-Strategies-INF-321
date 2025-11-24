import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useStrategies } from '@/hooks/useStrategies';
import { Filter } from 'lucide-react';

export default function Strategies() {
    const [filters, setFilters] = useState({
        proficiencyLevel: '',
        marketOutlook: '',
        volatilityView: '',
        riskProfile: '',
    });

    const activeFilters = useMemo(
        () =>
            Object.keys(filters).reduce((acc, key) => {
                const value = filters[key as keyof typeof filters];
                if (value) {
                    acc[key as keyof typeof filters] = value;
                }
                return acc;
            }, {} as Partial<typeof filters>),
        [filters],
    );

    const { strategies, loading, error } = useStrategies(activeFilters);

    const handleFilterChange = (key: string, value: string) => {
        setFilters((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold mb-2">Catálogo de Estratégias</h1>
                <p className="text-muted-foreground">
                    Explore e aprenda sobre diferentes estratégias de opções
                </p>
            </div>

            {/* Filters */}
            <div className="bg-card border border-border rounded-lg p-6 space-y-4">
                <div className="flex items-center space-x-2 mb-4">
                    <Filter className="w-5 h-5" />
                    <h2 className="font-semibold">Filtros</h2>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Proficiency Level */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Nível de Experiência</label>
                        <select
                            value={filters.proficiencyLevel}
                            onChange={(e) => handleFilterChange('proficiencyLevel', e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            <option value="">Todos</option>
                            <option value="BEGINNER">Iniciante</option>
                            <option value="INTERMEDIATE">Intermediário</option>
                            <option value="ADVANCED">Avançado</option>
                        </select>
                    </div>

                    {/* Market Outlook */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Perspectiva de Mercado</label>
                        <select
                            value={filters.marketOutlook}
                            onChange={(e) => handleFilterChange('marketOutlook', e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            <option value="">Todos</option>
                            <option value="BULLISH">Alta</option>
                            <option value="BEARISH">Baixa</option>
                            <option value="NEUTRAL">Neutra</option>
                        </select>
                    </div>

                    {/* Volatility View */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Volatilidade</label>
                        <select
                            value={filters.volatilityView}
                            onChange={(e) => handleFilterChange('volatilityView', e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            <option value="">Todos</option>
                            <option value="HIGH">Alta</option>
                            <option value="LOW">Baixa</option>
                        </select>
                    </div>

                    {/* Risk Profile */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Perfil de Risco</label>
                        <select
                            value={filters.riskProfile}
                            onChange={(e) => handleFilterChange('riskProfile', e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            <option value="">Todos</option>
                            <option value="LOW">Baixo</option>
                            <option value="MEDIUM">Médio</option>
                            <option value="HIGH">Alto</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Strategies List */}
            <div>
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                            <p className="text-muted-foreground">Carregando estratégias...</p>
                        </div>
                    </div>
                ) : error ? (
                    <div className="bg-destructive/10 border border-destructive rounded-lg p-4 text-destructive">
                        Erro ao carregar estratégias: {error}
                    </div>
                ) : strategies.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-muted-foreground">Nenhuma estratégia encontrada com os filtros selecionados</p>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {strategies.map((strategy) => (
                            <Link
                                key={strategy.id}
                                to={`/strategies/${strategy.id}`}
                                className="bg-card border border-border rounded-lg p-6 hover:border-primary transition-colors hover:shadow-lg"
                            >
                                <h3 className="text-lg font-bold mb-2">{strategy.name}</h3>
                                <p className="text-sm text-muted-foreground mb-4">{strategy.summary}</p>

                                <div className="space-y-2 mb-4">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Nível:</span>
                                        <span className="font-medium">{strategy.proficiencyLevel}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Perspectiva:</span>
                                        <span className="font-medium">{strategy.marketOutlook}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Volatilidade:</span>
                                        <span className="font-medium">{strategy.volatilityView}</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-border">
                                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                                        {strategy.strategyType}
                                    </span>
                                    <span className="text-primary font-medium text-sm">Ver detalhes →</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}