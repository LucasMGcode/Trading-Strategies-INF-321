import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface LayoutProps {
    children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Navigation */}
            <nav className="border-b border-border bg-card">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        {/* Logo */}
                        <Link to="/" className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                                <span className="text-primary-foreground font-bold">TS</span>
                            </div>
                            <span className="font-bold text-lg hidden sm:inline">Trading Strategies</span>
                        </Link>

                        {/* Desktop Menu */}
                        <div className="hidden md:flex items-center space-x-8">
                            <Link
                                to="/strategies"
                                className="text-foreground hover:text-primary transition-colors"
                            >
                                Estratégias
                            </Link>
                            <Link
                                to="/simulator"
                                className="text-foreground hover:text-primary transition-colors"
                            >
                                Simulador
                            </Link>
                            <Link
                                to="/dashboard"
                                className="text-foreground hover:text-primary transition-colors"
                            >
                                Dashboard
                            </Link>
                        </div>

                        {/* User Menu */}
                        <div className="hidden md:flex items-center space-x-4">
                            {user && (
                                <>
                                    <Link
                                        to="/profile"
                                        className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
                                    >
                                        <User className="w-4 h-4" />
                                        <span className="text-sm">{user.username}</span>
                                    </Link>
                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-destructive hover:text-destructive-foreground transition-colors"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        <span className="text-sm">Sair</span>
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors"
                        >
                            {isMenuOpen ? (
                                <X className="w-6 h-6" />
                            ) : (
                                <Menu className="w-6 h-6" />
                            )}
                        </button>
                    </div>

                    {/* Mobile Menu */}
                    {isMenuOpen && (
                        <div className="md:hidden pb-4 space-y-2">
                            <Link
                                to="/strategies"
                                className="block px-4 py-2 rounded-lg hover:bg-muted transition-colors"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Estratégias
                            </Link>
                            <Link
                                to="/simulator"
                                className="block px-4 py-2 rounded-lg hover:bg-muted transition-colors"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Simulador
                            </Link>
                            <Link
                                to="/dashboard"
                                className="block px-4 py-2 rounded-lg hover:bg-muted transition-colors"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Dashboard
                            </Link>
                            {user && (
                                <>
                                    <Link
                                        to="/profile"
                                        className="block px-4 py-2 rounded-lg hover:bg-muted transition-colors"
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        Perfil
                                    </Link>
                                    <button
                                        onClick={() => {
                                            handleLogout();
                                            setIsMenuOpen(false);
                                        }}
                                        className="w-full text-left px-4 py-2 rounded-lg hover:bg-destructive hover:text-destructive-foreground transition-colors"
                                    >
                                        Sair
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
            </main>
        </div>
    );
}