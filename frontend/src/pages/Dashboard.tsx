import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, setAccessToken } from '../lib/api';

interface UserInfo {
    id: number;
    username: string;
    email: string | null;
    created_at: string;
}

const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState<UserInfo | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>("");

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await api.get("/auth/me");
                setUser(res.data.user);
            } catch (err: any) {
                console.error("Failed to load user info:", err);
                setError("Session expired or unauthorized. Redirecting to login...");
                setTimeout(() => {
                    navigate("/login");
                }, 2000);
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, [navigate]);

    const handleLogout = async () => {
        try {
            await api.post("/auth/logout");
        } catch (err) {
            console.error("Logout failed:", err);
        } finally {
            setAccessToken(null);
            navigate("/login");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#070a13] flex items-center justify-center">
                <div className="text-center">
                    <svg className="animate-spin h-10 w-10 text-cyan-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <p className="text-slate-400 text-sm">Authenticating session...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[#070a13] flex items-center justify-center px-4">
                <div className="w-full max-w-md rounded-3xl border border-red-500/20 bg-red-500/10 p-6 text-center text-red-400">
                    {error}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#070a13] relative overflow-hidden text-white">
            {/* Background blur elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-purple-900/10 blur-[100px] pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-cyan-900/10 blur-[100px] pointer-events-none"></div>

            {/* Header / Navbar */}
            <header className="border-b border-white/5 bg-white/[0.01] backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-cyan-500 flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </div>
                        <span className="font-bold text-lg tracking-wide bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">Antigravity Cloud</span>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="px-4 py-2 rounded-xl border border-white/10 hover:bg-white/5 active:scale-95 text-sm font-semibold transition-all duration-150 cursor-pointer"
                    >
                        Sign Out
                    </button>
                </div>
            </header>

            {/* Main Area */}
            <main className="max-w-4xl mx-auto px-6 py-12">
                <div className="rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-xl p-8 shadow-2xl">
                    <h2 className="text-3xl font-extrabold mb-2 bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                        Welcome back, {user?.username}!
                    </h2>
                    <p className="text-slate-400 text-sm mb-8">
                        Your account is secure, and access credentials are rotated dynamically.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/5">
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4">Account Metadata</h3>
                            <div className="space-y-3">
                                <div>
                                    <span className="block text-slate-500 text-xs">User ID</span>
                                    <span className="font-mono text-sm">{user?.id}</span>
                                </div>
                                <div>
                                    <span className="block text-slate-500 text-xs">Registered Email</span>
                                    <span className="text-sm">{user?.email || "No email provided"}</span>
                                </div>
                                <div>
                                    <span className="block text-slate-500 text-xs">Member Since</span>
                                    <span className="text-sm">{user ? new Date(user.created_at).toLocaleString() : ""}</span>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/5 flex flex-col justify-between">
                            <div>
                                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Auth Security Architecture</h3>
                                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                                    The active session uses a short-lived memory access token. In the event of token expiration, Axios automatically completes an out-of-band JWT refresh hand-shake via an HTTP-Only cookie.
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span className="text-xs text-emerald-400 font-semibold uppercase tracking-wider">Dynamic Session Active</span>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
