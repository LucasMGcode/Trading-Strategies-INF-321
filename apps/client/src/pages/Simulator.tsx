import { useState } from 'react';
import { Play, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

export default function Simulator() {
    const [formData, setFormData] = useState({
        strategyId: '',
        assetId: '',
        startDate: '',
        endDate: '',
        simulationName: '',
    });

    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.strategyId || !formData.assetId || !formData.startDate || !formData.endDate) {
            toast.error('Por favor, preencha todos os campos obrigatórios');
            return;
        }

        try {
            setIsLoading(true);
            // Simulação de envio
            await new Promise((resolve) => setTimeout(resolve, 1000));
            toast.success('Simulação criada com sucesso!');
            setFormData({
                strategyId: '',
                assetId: '',
                startDate: '',
                endDate: '',
                simulationName: '',
            });
        } catch (error) {
            toast.error('Erro ao criar simulação');
        } finally {
            setIsLoading(false);
        }
    };

    const handleReset = () => {
        setFormData({
            strategyId: '',
            assetId: '',
            startDate: '',
            endDate: '',
            simulationName: '',
        });
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold mb-2">Simulador de Estratégias</h1>
                <p className="text-muted-foreground">
                    Teste estratégias com dados históricos e visualize resultados
                </p>
            </div>

            {/* Form */}
            <div className="bg-card border border-border rounded-lg p-8 max-w-2xl">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Simulation Name */}
                    <div>
                        <label htmlFor="simulationName" className="block text-sm font-medium mb-2">
                            Nome da Simulação (Opcional)
                        </label>
                        <input
                            id="simulationName"
                            type="text"
                            name="simulationName"
                            value={formData.simulationName}
                            onChange={handleChange}
                            placeholder="Ex: Teste Long Call em PETR4"
                            className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                            disabled={isLoading}
                        />
                    </div>

                    {/* Strategy */}
                    <div>
                        <label htmlFor="strategyId" className="block text-sm font-medium mb-2">
                            Estratégia *
                        </label>
                        <select
                            id="strategyId"
                            name="strategyId"
                            value={formData.strategyId}
                            onChange={handleChange}
                            className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                            disabled={isLoading}
                        >
                            <option value="">Selecione uma estratégia</option>
                            <option value="1">Long Call</option>
                            <option value="2">Long Put</option>
                            <option value="3">Short Call</option>
                            <option value="4">Short Put</option>
                            <option value="5">Straddle</option>
                        </select>
                    </div>

                    {/* Asset */}
                    <div>
                        <label htmlFor="assetId" className="block text-sm font-medium mb-2">
                            Ativo *
                        </label>
                        <select
                            id="assetId"
                            name="assetId"
                            value={formData.assetId}
                            onChange={handleChange}
                            className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                            disabled={isLoading}
                        >
                            <option value="">Selecione um ativo</option>
                            <option value="1">PETR4 - Petrobras</option>
                            <option value="2">VALE3 - Vale</option>
                            <option value="3">ITUB4 - Itaú</option>
                            <option value="4">BBDC4 - Bradesco</option>
                            <option value="5">WEGE3 - WEG</option>
                        </select>
                    </div>

                    {/* Date Range */}
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="startDate" className="block text-sm font-medium mb-2">
                                Data de Início *
                            </label>
                            <input
                                id="startDate"
                                type="date"
                                name="startDate"
                                value={formData.startDate}
                                onChange={handleChange}
                                className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                                disabled={isLoading}
                            />
                        </div>
                        <div>
                            <label htmlFor="endDate" className="block text-sm font-medium mb-2">
                                Data de Término *
                            </label>
                            <input
                                id="endDate"
                                type="date"
                                name="endDate"
                                value={formData.endDate}
                                onChange={handleChange}
                                className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-4 pt-4">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Play className="w-4 h-4" />
                            <span>{isLoading ? 'Simulando...' : 'Executar Simulação'}</span>
                        </button>
                        <button
                            type="button"
                            onClick={handleReset}
                            disabled={isLoading}
                            className="flex items-center justify-center space-x-2 px-6 py-3 rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <RotateCcw className="w-4 h-4" />
                            <span>Limpar</span>
                        </button>
                    </div>
                </form>
            </div>

            {/* Info */}
            <div className="bg-accent/10 border border-accent rounded-lg p-6">
                <h3 className="font-semibold mb-2">Como funciona?</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Selecione uma estratégia de opções</li>
                    <li>• Escolha um ativo (ação, ETF, índice)</li>
                    <li>• Defina o período histórico para análise</li>
                    <li>• Clique em "Executar Simulação" para ver os resultados</li>
                    <li>• Analise o lucro/prejuízo e métricas de performance</li>
                </ul>
            </div>
        </div>
    );
}