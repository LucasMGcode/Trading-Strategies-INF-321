import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { User, Lock, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Profile() {
    const { user, logout } = useAuth();
    const [isEditingPassword, setIsEditingPassword] = useState(false);
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [isLoading, setIsLoading] = useState(false);

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setPasswordData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (
            !passwordData.currentPassword ||
            !passwordData.newPassword ||
            !passwordData.confirmPassword
        ) {
            toast.error('Por favor, preencha todos os campos');
            return;
        }

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error('As senhas não conferem');
            return;
        }

        try {
            setIsLoading(true);
            // Simulação de envio
            await new Promise((resolve) => setTimeout(resolve, 1000));
            toast.success('Senha alterada com sucesso!');
            setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: '',
            });
            setIsEditingPassword(false);
        } catch {
            toast.error('Erro ao alterar senha');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (
            window.confirm(
                'Tem certeza que deseja deletar sua conta? Esta ação não pode ser desfeita.'
            )
        ) {
            try {
                setIsLoading(true);
                // Simulação de envio
                await new Promise((resolve) => setTimeout(resolve, 1000));
                toast.success('Conta deletada com sucesso');
                await logout();
            } catch {
                toast.error('Erro ao deletar conta');
            } finally {
                setIsLoading(false);
            }
        }
    };

    return (
        <div className="space-y-8 max-w-2xl">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold mb-2">Meu Perfil</h1>
                <p className="text-muted-foreground">Gerencie suas informações e configurações</p>
            </div>

            {/* User Info */}
            <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center space-x-4 mb-6">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold">{user?.username}</h2>
                        <p className="text-muted-foreground">{user?.email}</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Usuário</label>
                        <p className="text-foreground">{user?.username}</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Email</label>
                        <p className="text-foreground">{user?.email}</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Nível de Experiência</label>
                        <p className="text-foreground">{user?.experienceLevel}</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Membro desde</label>
                        <p className="text-foreground">
                            {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('pt-BR') : '-'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Change Password */}
            <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center space-x-2 mb-4">
                    <Lock className="w-5 h-5" />
                    <h2 className="text-xl font-bold">Alterar Senha</h2>
                </div>

                {!isEditingPassword ? (
                    <button
                        onClick={() => setIsEditingPassword(true)}
                        className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
                    >
                        Alterar Senha
                    </button>
                ) : (
                    <form onSubmit={handlePasswordSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="currentPassword" className="block text-sm font-medium mb-2">
                                Senha Atual
                            </label>
                            <input
                                id="currentPassword"
                                type="password"
                                name="currentPassword"
                                value={passwordData.currentPassword}
                                onChange={handlePasswordChange}
                                className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                                disabled={isLoading}
                            />
                        </div>

                        <div>
                            <label htmlFor="newPassword" className="block text-sm font-medium mb-2">
                                Nova Senha
                            </label>
                            <input
                                id="newPassword"
                                type="password"
                                name="newPassword"
                                value={passwordData.newPassword}
                                onChange={handlePasswordChange}
                                className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                                disabled={isLoading}
                            />
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
                                Confirmar Nova Senha
                            </label>
                            <input
                                id="confirmPassword"
                                type="password"
                                name="confirmPassword"
                                value={passwordData.confirmPassword}
                                onChange={handlePasswordChange}
                                className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                                disabled={isLoading}
                            />
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? 'Salvando...' : 'Salvar'}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsEditingPassword(false);
                                    setPasswordData({
                                        currentPassword: '',
                                        newPassword: '',
                                        confirmPassword: '',
                                    });
                                }}
                                className="flex-1 px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors"
                            >
                                Cancelar
                            </button>
                        </div>
                    </form>
                )}
            </div>

            {/* Delete Account */}
            <div className="bg-destructive/10 border border-destructive rounded-lg p-6">
                <div className="flex items-center space-x-2 mb-4">
                    <Trash2 className="w-5 h-5 text-destructive" />
                    <h2 className="text-xl font-bold text-destructive">Deletar Conta</h2>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                    Deletar sua conta é permanente e não pode ser desfeito. Todos os seus dados serão removidos.
                </p>
                <button
                    onClick={handleDeleteAccount}
                    disabled={isLoading}
                    className="px-4 py-2 rounded-lg bg-destructive text-destructive-foreground font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Deletar Minha Conta
                </button>
            </div>
        </div>
    );
}