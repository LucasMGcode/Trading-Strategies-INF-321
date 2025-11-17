import { useParams, Link } from 'react-router-dom';
import { useStrategy } from '@/hooks/useStrategies';
import { ArrowLeft } from 'lucide-react';

export default function StrategyDetail() {
    const { id } = useParams<{ id: string }>();
    const { strategy, loading, error } = useStrategy(id || '');

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Carregando estratégia...</p>
                </div>
            </div>
        );
    }

    if (error || !strategy) {
        return (
            <div className="space-y-4">
                <Link to="/strategies" className="flex items-center space-x-2 text-primary hover:underline">
                    <ArrowLeft className="w-4 h-4" />
                    <span>Voltar para estratégias</span>
                </Link>
                <div className="bg-destructive/10 border border-destructive rounded-lg p-4 text-destructive">
                    Erro ao carregar estratégia: {error}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Back Button */}
            <Link to="/strategies" className="flex items-center space-x-2 text-primary hover:underline">
                <ArrowLeft className="w-4 h-4" />
                <span>Voltar para estratégias</span>
            </Link>

            {/* Header */}
            <div>
                <h1 className="text-4xl font-bold mb-2">{strategy.name}</h1>
                <p className="text-lg text-muted-foreground">{strategy.description}</p>
            </div>

            {/* Info Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-card border border-border rounded-lg p-4">
                    <p className="text-sm text-muted-foreground mb-1">Nível</p>
                    <p className="text-lg font-bold">{strategy.proficiencyLevel}</p>
                </div>
                <div className="bg-card border border-border rounded-lg p-4">
                    <p className="text-sm text-muted-foreground mb-1">Perspectiva</p>
                    <p className="text-lg font-bold">{strategy.marketOutlook}</p>
                </div>
                <div className="bg-card border border-border rounded-lg p-4">
                    <p className="text-sm text-muted-foreground mb-1">Volatilidade</p>
                    <p className="text-lg font-bold">{strategy.volatilityView}</p>
                </div>
                <div className="bg-card border border-border rounded-lg p-4">
                    <p className="text-sm text-muted-foreground mb-1">Tipo</p>
                    <p className="text-lg font-bold">{strategy.strategyType}</p>
                </div>
            </div>

            {/* Legs */}
            {strategy.legs && strategy.legs.length > 0 && (
                <div>
                    <h2 className="text-2xl font-bold mb-4">Pernas da Estratégia</h2>
                    <div className="bg-card border border-border rounded-lg overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-muted border-b border-border">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Ação</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Tipo</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Quantidade</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Strike</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Sequência</th>
                                </tr>
                            </thead>
                            <tbody>
                                {strategy.legs.map((leg, index) => (
                                    <tr key={index} className="border-b border-border hover:bg-muted">
                                        <td className="px-4 py-3 text-sm">{leg.action}</td>
                                        <td className="px-4 py-3 text-sm">{leg.instrumentType}</td>
                                        <td className="px-4 py-3 text-sm">{leg.quantityRatio}</td>
                                        <td className="px-4 py-3 text-sm">{leg.strikeRelation}</td>
                                        <td className="px-4 py-3 text-sm">{leg.orderSequence}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* CTA */}
            <div className="flex gap-4">
                <Link
                    to="/simulator"
                    className="px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
                >
                    Simular Estratégia
                </Link>
            </div>
        </div>
    );
}