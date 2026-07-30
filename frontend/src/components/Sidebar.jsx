import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Map as MapIcon,
    User,
    LogOut,
    Sprout,
    Bell,
    Settings,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ isOpen, toggleSidebar }) {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    const menuItems = [
        { name: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/dashboard' },
        { name: 'Farm Map', icon: <MapIcon size={20} />, path: '/farmmap' },
        { name: 'Farmer Profile', icon: <User size={20} />, path: '/profile' },
    ];

    return (
        <aside
            className={`fixed top-0 left-0 h-full z-50 transition-all duration-300 ease-in-out ${isOpen ? 'w-64' : 'w-20'
                } bg-white/80 backdrop-blur-xl border-r border-slate-200/60 shadow-xl`}
        >
            <div className="flex flex-col h-full">
                {/* Logo Section */}
                <div className="p-6 flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-green-200">
                        <Sprout size={24} />
                    </div>
                    {isOpen && (
                        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-emerald-700">
                            AgriSmart
                        </span>
                    )}
                </div>

                {/* Navigation Section */}
                <nav className="flex-1 px-4 space-y-2 mt-4">
                    {menuItems.map((item) => (
                        <NavLink
                            key={item.name}
                            to={item.path}
                            className={({ isActive }) => `
                flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300
                ${isActive
                                    ? 'bg-green-50 text-green-700 shadow-sm'
                                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}
              `}
                            title={item.name}
                        >
                            <div className="flex-shrink-0">{item.icon}</div>
                            {isOpen && <span className="font-medium">{item.name}</span>}
                        </NavLink>
                    ))}
                </nav>

                {/* User & Logout Section */}
                <div className="p-4 border-t border-slate-100">
                    {isOpen && (
                        <div className="mb-4 px-4 py-3 bg-slate-50 rounded-2xl flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold border-2 border-white shadow-sm">
                                {currentUser?.email?.[0].toUpperCase()}
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-sm font-semibold text-slate-900 truncate">{currentUser?.email?.split('@')[0]}</p>
                                <p className="text-xs text-slate-500 truncate">{currentUser?.email}</p>
                            </div>
                        </div>
                    )}

                    <button
                        onClick={handleLogout}
                        className={`
              w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-red-500 hover:bg-red-50 transition-all duration-300
              ${!isOpen && 'justify-center'}
            `}
                        title="Logout"
                    >
                        <LogOut size={20} />
                        {isOpen && <span className="font-medium">Logout</span>}
                    </button>
                </div>

                {/* Toggle Button */}
                <button
                    onClick={toggleSidebar}
                    className="absolute -right-3 top-20 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-md hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-all"
                >
                    {isOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
                </button>
            </div>
        </aside>
    );
}
