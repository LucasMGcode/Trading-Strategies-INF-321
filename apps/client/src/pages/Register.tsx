import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export default function Register() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [experienceLevel, setExperienceLevel] = useState('BEGINNER');
    const [isLoading, setIsLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!username || !email || !password || !confirmPassword) {
            toast.error('Por favor, preencha todos os campos');
            return;
        }

        if (password !== confirmPassword) {
            toast.error('As senhas não conferem');
            return;
        }

        if (password.length < 6) {
            toast.error('A senha deve ter pelo menos 6 caracteres');
            return;
        }

        try {
            setIsLoading(true);
            await register(username, email, password, experienceLevel);
            toast.success('Conta criada com sucesso!');
            navigate('/dashboard');
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'Erro ao registrar';
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <Link to="/" className="inline-flex items-center space-x-2">
                        <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                            <span className="text-primary-foreground font-bold">TS</span>
                        </div>
                        <span className="font-bold text-xl">Trading Strategies</span>
                    </Link>
                </div>

                {/* Form */}
                <div className="bg-card border border-border rounded-lg p-8">
                    <h1 className="text-2xl font-bold mb-2">Criar conta</h1>
                    <p className="text-muted-foreground mb-6">Registre-se para começar a explorar estratégias</p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Username */}
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium mb-2">
                                Usuário
                            </label>
                            <input
                                id="username"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="seu_usuario"
                                className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                                disabled={isLoading}
                            />
                        </div>

                        {/* Email */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium mb-2">
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="seu@email.com"
                                className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                                disabled={isLoading}
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium mb-2">
                                Senha
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                                disabled={isLoading}
                            />
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
                                Confirmar Senha
                            </label>
                            <input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                                disabled={isLoading}
                            />
                        </div>

                        {/* Experience Level */}
                        <div>
                            <label htmlFor="experienceLevel" className="block text-sm font-medium mb-2">
                                Nível de Experiência
                            </label>
                            <select
                                id="experienceLevel"
                                value={experienceLevel}
                                onChange={(e) => setExperienceLevel(e.target.value)}
                                className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                                disabled={isLoading}
                            >
                                <option value="BEGINNER">Iniciante</option>
                                <option value="INTERMEDIATE">Intermediário</option>
                                <option value="ADVANCED">Avançado</option>
                            </select>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Registrando...' : 'Registrar'}
                        </button>
                    </form>

                    {/* Login Link */}
                    <p className="text-center text-muted-foreground mt-6">
                        Já tem uma conta?{' '}
                        <Link to="/login" className="text-primary hover:underline">
                            Faça login aqui
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}