import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Sprout, Mail, Lock, Loader2, ArrowRight } from "lucide-react";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const { login, currentUser } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (currentUser) {
            navigate("/dashboard");
        }
    }, [currentUser, navigate]);

    async function handleSubmit(e) {
        e.preventDefault();

        try {
            setError("");
            setLoading(true);
            await login(email, password);
            navigate("/dashboard");
        } catch (err) {
            setError("Invalid email or password. Please try again.");
        }
        setLoading(false);
    }

    return (
        <div className="min-h-screen flex flex-col lg:flex-row bg-white">
            {/* Left Side: Branding & Info */}
            <div className="hidden lg:flex lg:w-1/2 agri-gradient p-12 flex-col justify-between text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-24 opacity-10 rotate-12">
                    <Sprout size={400} />
                </div>

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-12">
                        <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20">
                            <Sprout size={28} />
                        </div>
                        <span className="text-2xl font-bold tracking-tight">AgriSmart</span>
                    </div>

                    <div className="space-y-6 max-w-md mt-24">
                        <h1 className="text-5xl font-bold leading-tight">Empowering farmers with AI-driven intelligence.</h1>
                        <p className="text-green-50/80 text-lg">
                            Monitor your crops, detect diseases early, and optimize your farm's health with our advanced drone-integrated platform.
                        </p>
                    </div>
                </div>

                <div className="relative z-10 flex items-center gap-6 text-sm font-medium">
                    <span className="opacity-60">© 2026 AgriSmart Inc.</span>
                    <a href="#" className="hover:text-green-100 transition-colors">Privacy Policy</a>
                    <a href="#" className="hover:text-green-100 transition-colors">Terms of Service</a>
                </div>
            </div>

            {/* Right Side: Login Form */}
            <div className="flex-1 flex items-center justify-center p-8 sm:p-12">
                <div className="w-full max-w-md space-y-10">
                    <div className="text-center lg:text-left">
                        <div className="lg:hidden mx-auto h-16 w-16 agri-gradient rounded-2xl flex items-center justify-center shadow-lg shadow-green-200 mb-8">
                            <Sprout size={32} className="text-white" />
                        </div>
                        <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">
                            Welcome Back
                        </h2>
                        <p className="mt-4 text-slate-500 font-medium">
                            Log in to access your farm's dashboard and drone data.
                        </p>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-4 rounded-2xl text-sm flex items-center gap-3 animate-fade-in">
                            <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse flex-shrink-0"></div>
                            {error}
                        </div>
                    )}

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 ml-1">Email Address</label>
                            <div className="relative group">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-green-600 transition-colors">
                                    <Mail size={18} />
                                </span>
                                <input
                                    type="email"
                                    required
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-50 focus:bg-white focus:border-green-500 focus:ring-4 focus:ring-green-500/5 rounded-2xl transition-all outline-none text-slate-900 placeholder-slate-400"
                                    placeholder="farmer@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between ml-1">
                                <label className="text-sm font-bold text-slate-700">Password</label>
                                <a href="#" className="text-xs font-bold text-green-600 hover:text-green-700">Forgot?</a>
                            </div>
                            <div className="relative group">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-green-600 transition-colors">
                                    <Lock size={18} />
                                </span>
                                <input
                                    type="password"
                                    required
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-50 focus:bg-white focus:border-green-500 focus:ring-4 focus:ring-green-500/5 rounded-2xl transition-all outline-none text-slate-900 placeholder-slate-400"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-2xl font-bold text-lg shadow-xl shadow-slate-200 transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <Loader2 className="animate-spin" size={20} />
                            ) : (
                                <>Sign In <ArrowRight size={20} /></>
                            )}
                        </button>
                    </form>

                    <p className="text-center text-slate-500 font-medium pt-4">
                        New to AgriSmart?{" "}
                        <Link to="/register" className="text-green-600 font-bold hover:text-green-700 underline underline-offset-4">
                            Create an account
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
