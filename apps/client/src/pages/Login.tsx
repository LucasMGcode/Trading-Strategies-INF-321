import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import axios from 'axios';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !password) {
            toast.error('Por favor, preencha todos os campos');
            return;
        }

        try {
            setIsLoading(true);
            await login(email, password);
            toast.success('Login realizado com sucesso!');
            navigate('/Dashboard'); // TODO Verificar motivo pelo qual só está funcionando com D maiúsculo
        } catch (error: unknown) {
            const errorMessage =
                axios.isAxiosError(error)
                    ? (error.response?.data as { message?: string })?.message || 'Erro ao fazer login'
                    : 'Erro ao fazer login';

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
                    <h1 className="text-2xl font-bold mb-2">Bem-vindo de volta</h1>
                    <p className="text-muted-foreground mb-6">Faça login para acessar sua conta</p>

                    <form onSubmit={handleSubmit} className="space-y-4">
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

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Entrando...' : 'Entrar'}
                        </button>
                    </form>

                    {/* Register Link */}
                    <p className="text-center text-muted-foreground mt-6">
                        Não tem uma conta?{' '}
                        <Link to="/register" className="text-primary hover:underline">
                            Registre-se aqui
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}