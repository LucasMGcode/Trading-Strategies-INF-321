import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

// Pages
import Home from '@/pages/Home';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Strategies from '@/pages/Strategies';
import StrategyDetail from '@/pages/StrategyDetail';
import Dashboard from '@/pages/Dashboard';
import Simulator from '@/pages/Simulator';
import Profile from '@/pages/Profile';

// Components
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';

const queryClient = new QueryClient();

function App() {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Carregando...</p>
                </div>
            </div>
        );
    }

    return (
        <QueryClientProvider client={queryClient}>
            <Router>
                <Routes>
                    {/* Public routes */}
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />

                    {/* Protected routes */}
                    <Route
                        path="/strategies"
                        element={
                            <ProtectedRoute isAuthenticated={isAuthenticated}>
                                <Layout>
                                    <Strategies />
                                </Layout>
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/strategies/:id"
                        element={
                            <ProtectedRoute isAuthenticated={isAuthenticated}>
                                <Layout>
                                    <StrategyDetail />
                                </Layout>
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedRoute isAuthenticated={isAuthenticated}>
                                <Layout>
                                    <Dashboard />
                                </Layout>
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/simulator"
                        element={
                            <ProtectedRoute isAuthenticated={isAuthenticated}>
                                <Layout>
                                    <Simulator />
                                </Layout>
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/profile"
                        element={
                            <ProtectedRoute isAuthenticated={isAuthenticated}>
                                <Layout>
                                    <Profile />
                                </Layout>
                            </ProtectedRoute>
                        }
                    />

                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Router>
            <Toaster />
        </QueryClientProvider>
    );
}

export default App;
