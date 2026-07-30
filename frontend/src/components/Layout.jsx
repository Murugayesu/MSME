import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { Bell, Search, Menu } from 'lucide-react';

export default function Layout({ children }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    return (
        <div className="min-h-screen bg-slate-50 flex overflow-hidden">
            {/* Sidebar */}
            <Sidebar isOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

            {/* Main Content Area */}
            <div
                className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${isSidebarOpen ? 'ml-64' : 'ml-20'
                    }`}
            >
                {/* Top Navbar */}
                <header className="h-20 bg-white/60 backdrop-blur-md border-b border-slate-200/60 flex items-center justify-between px-8 sticky top-0 z-40">
                    <div className="flex items-center gap-4 flex-1">
                        <div className="relative w-full max-w-md group">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-green-600 transition-colors">
                                <Search size={18} />
                            </span>
                            <input
                                type="text"
                                placeholder="Search farm data, crops, or alerts..."
                                className="w-full pl-12 pr-4 py-2.5 bg-slate-100/50 border-transparent focus:bg-white focus:border-green-500/30 focus:ring-4 focus:ring-green-500/5 rounded-2xl transition-all outline-none text-sm"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <button className="relative w-10 h-10 flex items-center justify-center text-slate-500 hover:bg-slate-100 rounded-xl transition-all">
                            <Bell size={20} />
                            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 border-2 border-white rounded-full"></span>
                        </button>

                        <div className="h-8 w-px bg-slate-200 mx-2"></div>

                        <button className="flex items-center gap-3 p-1.5 hover:bg-slate-100 rounded-2xl transition-all">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-green-600 to-emerald-500 flex items-center justify-center text-white text-xs font-bold shadow-md">
                                AD
                            </div>
                            <span className="text-sm font-semibold text-slate-700 hidden sm:block">Agri Dashboard</span>
                        </button>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-8 animate-fade-in">
                    <div className="max-w-7xl mx-auto h-full">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
