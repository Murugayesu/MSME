import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Sprout, Mail, Lock, User, Loader2, ArrowRight, ShieldCheck } from "lucide-react";

export default function Register() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [username, setUsername] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const { signup } = useAuth();
    const navigate = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();

        if (password !== confirmPassword) {
            return setError("Passwords do not match");
        }

        try {
            setError("");
            setLoading(true);
            await signup(email, password, username);
            navigate("/dashboard");
        } catch (err) {
            setError("Failed to create account. Please try again.");
        }
        setLoading(false);
    }

    return (
        <div className="min-h-screen flex flex-col lg:flex-row bg-white">
            {/* Left Side: Info */}
            <div className="hidden lg:flex lg:w-1/3 agri-gradient p-12 flex-col justify-between text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12">
                    <Sprout size={300} />
                </div>

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-12">
                        <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20">
                            <Sprout size={24} />
                        </div>
                        <span className="text-xl font-bold tracking-tight">AgriSmart</span>
                    </div>

                    <div className="space-y-6 mt-20">
                        <h2 className="text-4xl font-bold leading-tight">Start your smart farming journey today.</h2>
                        <ul className="space-y-4 text-green-50/80">
                            <li className="flex items-center gap-3">
                                <ShieldCheck size={20} className="text-white" />
                                <span>Real-time crop health monitoring</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <ShieldCheck size={20} className="text-white" />
                                <span>AI-powered disease detection</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <ShieldCheck size={20} className="text-white" />
                                <span>Actionable treatment insight</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="relative z-10 text-xs font-medium opacity-60">
                    © 2026 AgriSmart Inc. All rights reserved.
                </div>
            </div>

            {/* Right Side: Register Form */}
            <div className="flex-1 flex items-center justify-center p-8 sm:p-12">
                <div className="w-full max-w-md space-y-8">
                    <div>
                        <div className="lg:hidden mx-auto h-16 w-16 agri-gradient rounded-2xl flex items-center justify-center shadow-lg shadow-green-200 mb-8">
                            <Sprout size={32} className="text-white" />
                        </div>
                        <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">
                            Create Account
                        </h2>
                        <p className="mt-3 text-slate-500 font-medium">
                            Join thousands of farmers using AI to protect their yield.
                        </p>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-4 rounded-2xl text-sm flex items-center gap-3 animate-fade-in">
                            <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse flex-shrink-0"></div>
                            {error}
                        </div>
                    )}

                    <form className="space-y-5" onSubmit={handleSubmit}>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Full Name</label>
                            <div className="relative group">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-green-600 transition-colors">
                                    <User size={18} />
                                </span>
                                <input
                                    type="text"
                                    required
                                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-slate-50 focus:bg-white focus:border-green-500 focus:ring-4 focus:ring-green-500/5 rounded-2xl transition-all outline-none text-slate-900 placeholder-slate-400"
                                    placeholder="Varun Kumar"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Email Address</label>
                            <div className="relative group">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-green-600 transition-colors">
                                    <Mail size={18} />
                                </span>
                                <input
                                    type="email"
                                    required
                                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-slate-50 focus:bg-white focus:border-green-500 focus:ring-4 focus:ring-green-500/5 rounded-2xl transition-all outline-none text-slate-900 placeholder-slate-400"
                                    placeholder="farmer@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Password</label>
                                <div className="relative group">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-green-600 transition-colors">
                                        <Lock size={18} />
                                    </span>
                                    <input
                                        type="password"
                                        required
                                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-slate-50 focus:bg-white focus:border-green-500 focus:ring-4 focus:ring-green-500/5 rounded-2xl transition-all outline-none text-slate-900 placeholder-slate-400"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Confirm</label>
                                <div className="relative group">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-green-600 transition-colors">
                                        <Lock size={18} />
                                    </span>
                                    <input
                                        type="password"
                                        required
                                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-slate-50 focus:bg-white focus:border-green-500 focus:ring-4 focus:ring-green-500/5 rounded-2xl transition-all outline-none text-slate-900 placeholder-slate-400"
                                        placeholder="••••••••"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 p-1">
                            <input type="checkbox" required className="mt-1 w-4 h-4 rounded border-slate-300 text-green-600 focus:ring-green-500" />
                            <p className="text-xs text-slate-500 leading-relaxed">
                                I agree to the <a href="#" className="text-green-600 font-bold hover:underline">Terms</a> and <a href="#" className="text-green-600 font-bold hover:underline">Privacy Policy</a>.
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-2xl font-bold text-lg shadow-xl shadow-slate-200 transition-all flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <Loader2 className="animate-spin" size={20} />
                            ) : (
                                <>Create Account <ArrowRight size={20} /></>
                            )}
                        </button>
                    </form>

                    <p className="text-center text-slate-500 font-medium pt-2">
                        Already have an account?{" "}
                        <Link to="/login" className="text-green-600 font-bold hover:text-green-700 underline underline-offset-4">
                            Sign in instead
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
