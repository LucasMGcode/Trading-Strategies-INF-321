import { useAuth } from '../hooks/useAuth';

function Dashboard() {
    const { user } = useAuth();

    return (
        <div className="space-y-4">
            <h1 className="text-2xl font-semibold">Dashboard</h1>
            <p className="text-slate-300">
                Olá, <span className="font-medium">{user?.username}</span>! 👋
            </p>
            <p className="text-slate-400 text-sm">
                Aqui futuramente você vai ver resumos de estratégias favoritas, últimas
                simulações e métricas de risco.
            </p>
        </div>
    );
}

export default Dashboard;