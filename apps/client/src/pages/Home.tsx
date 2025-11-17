import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

function Home() {
    const { user } = useAuth();

    return (
        <div className="space-y-4">
            <h1 className="text-3xl font-bold">
                Bem-vindo ao Trading Strategies Dashboard
            </h1>
            <p className="text-slate-300 max-w-xl">
                Aqui você poderá explorar estratégias de opções do livro do Guy Cohen,
                simular operações e acompanhar seu perfil de risco.
            </p>

            {!user && (
                <div className="flex gap-3">
                    <Link
                        to="/login"
                        className="px-4 py-2 rounded-md bg-primary-600 hover:bg-primary-500 text-white text-sm"
                    >
                        Entrar
                    </Link>
                    <Link
                        to="/register"
                        className="px-4 py-2 rounded-md border border-slate-600 text-sm hover:bg-slate-800"
                    >
                        Criar conta
                    </Link>
                </div>
            )}

            {user && (
                <Link
                    to="/dashboard"
                    className="px-4 py-2 rounded-md bg-primary-600 hover:bg-primary-500 text-white text-sm"
                >
                    Ir para o Dashboard
                </Link>
            )}
        </div>
    );
}

export default Home;