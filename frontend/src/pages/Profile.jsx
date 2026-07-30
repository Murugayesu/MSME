import React, { useState, useEffect } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL
    || (import.meta.env.DEV ? 'http://localhost:8000' : 'https://msme-fastapi-service.onrender.com');
import { useAuth } from '../context/AuthContext';

import { User, MapPin, Scale, Sprout, Save, Edit2, LogOut, Loader2, Mail, Phone, Calendar, CheckCircle, AlertCircle } from 'lucide-react';

export default function Profile() {
    const { currentUser, logout } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [toast, setToast] = useState(null); // { type: 'success' | 'error', message: string }
    const [profileData, setProfileData] = useState({
        username: '',
        farmLocation: '',
        farmSize: '',
        mainCrops: '',
        phoneNumber: '',
        experience: ''
    });

    useEffect(() => {
        if (currentUser) {
            fetchProfile();
        }
    }, [currentUser]);

    const showToast = (type, message) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 3500);
    };

    const fetchProfile = async () => {
        try {
            const token = await currentUser.getIdToken();
            const response = await fetch(`${API_BASE_URL}/api/profile/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setProfileData({
                    username: data.username || '',
                    farmLocation: data.farmLocation || data.farm_location || '',
                    farmSize: data.farmSize || data.farm_size || '',
                    mainCrops: Array.isArray(data.mainCrops)
                        ? data.mainCrops.join(', ')
                        : (data.mainCrops || data.main_crops || ''),
                    phoneNumber: data.phoneNumber || data.phone_number || '',
                    experience: data.experience || ''
                });
            } else {
                throw new Error("Failed to fetch profile");
            }
        } catch (error) {
            console.error("Error fetching profile:", error);
            showToast('error', 'Failed to load profile data.');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const token = await currentUser.getIdToken();
            const response = await fetch(`${API_BASE_URL}/api/profile/update`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    username: profileData.username,
                    email: currentUser.email,
                    farm_location: profileData.farmLocation,
                    farm_size: profileData.farmSize,
                    main_crops: profileData.mainCrops,
                    phone_number: profileData.phoneNumber,
                    experience: profileData.experience
                })
            });

            if (response.ok) {
                setIsEditing(false);
                showToast('success', 'Profile saved successfully!');
            } else {
                throw new Error("Failed to save profile");
            }
        } catch (error) {
            console.error("Error updating profile:", error);
            showToast('error', 'Failed to save profile. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <Loader2 className="animate-spin text-green-600 mb-4" size={48} />
            <p className="text-slate-500 font-medium">Loading your profile...</p>
        </div>
    );

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
            {/* Toast Notification */}
            {toast && (
                <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-xl font-semibold text-sm transition-all ${toast.type === 'success'
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                    {toast.type === 'success'
                        ? <CheckCircle size={18} />
                        : <AlertCircle size={18} />}
                    {toast.message}
                </div>
            )}

            {/* Header / Intro */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="flex items-center gap-6">
                    <div className="relative group">
                        <div className="w-24 h-24 agri-gradient rounded-3xl flex items-center justify-center text-white shadow-xl shadow-green-200 relative z-10">
                            <User size={48} />
                        </div>
                        <div className="absolute inset-0 bg-green-400 blur-2xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">{profileData.username || 'Farmer Name'}</h1>
                        <div className="flex items-center gap-4 mt-2 text-slate-500">
                            <span className="flex items-center gap-1.5 text-sm"><Mail size={14} /> {currentUser.email}</span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-3">
                    {!isEditing ? (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
                        >
                            <Edit2 size={18} /> Edit Profile
                        </button>
                    ) : (
                        <button
                            onClick={() => setIsEditing(false)}
                            className="flex items-center gap-2 px-6 py-3 bg-slate-100 rounded-2xl font-bold text-slate-600 hover:bg-slate-200 transition-all"
                        >
                            Cancel
                        </button>
                    )}
                    <button
                        onClick={logout}
                        className="flex items-center gap-2 px-6 py-3 bg-red-50 text-red-600 rounded-2xl font-bold hover:bg-red-100 transition-all shadow-sm shadow-red-100"
                    >
                        <LogOut size={18} /> Sign Out
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Profile Form / Info */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="glass-card p-8">
                        <h3 className="text-xl font-bold text-slate-900 mb-8 flex items-center gap-2">
                            Farm Information
                        </h3>

                        <form onSubmit={handleUpdate} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Username / Name</label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input
                                            disabled={!isEditing}
                                            type="text"
                                            value={profileData.username}
                                            onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                                            className="w-full pl-12 pr-4 py-3.5 bg-slate-50/50 border border-slate-100 rounded-2xl focus:bg-white focus:border-green-500 transition-all outline-none disabled:opacity-75 disabled:cursor-not-allowed"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Phone Number</label>
                                    <div className="relative">
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input
                                            disabled={!isEditing}
                                            type="text"
                                            value={profileData.phoneNumber}
                                            onChange={(e) => setProfileData({ ...profileData, phoneNumber: e.target.value })}
                                            className="w-full pl-12 pr-4 py-3.5 bg-slate-50/50 border border-slate-100 rounded-2xl focus:bg-white focus:border-green-500 transition-all outline-none disabled:opacity-75"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Farm Location</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input
                                            disabled={!isEditing}
                                            type="text"
                                            value={profileData.farmLocation}
                                            onChange={(e) => setProfileData({ ...profileData, farmLocation: e.target.value })}
                                            className="w-full pl-12 pr-4 py-3.5 bg-slate-50/50 border border-slate-100 rounded-2xl focus:bg-white focus:border-green-500 transition-all outline-none disabled:opacity-75"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Farm Size (Acres)</label>
                                    <div className="relative">
                                        <Scale className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input
                                            disabled={!isEditing}
                                            type="text"
                                            value={profileData.farmSize}
                                            onChange={(e) => setProfileData({ ...profileData, farmSize: e.target.value })}
                                            className="w-full pl-12 pr-4 py-3.5 bg-slate-50/50 border border-slate-100 rounded-2xl focus:bg-white focus:border-green-500 transition-all outline-none disabled:opacity-75"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Main Crops</label>
                                    <div className="relative">
                                        <Sprout className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input
                                            disabled={!isEditing}
                                            type="text"
                                            value={profileData.mainCrops}
                                            onChange={(e) => setProfileData({ ...profileData, mainCrops: e.target.value })}
                                            className="w-full pl-12 pr-4 py-3.5 bg-slate-50/50 border border-slate-100 rounded-2xl focus:bg-white focus:border-green-500 transition-all outline-none disabled:opacity-75"
                                            placeholder="e.g., Rice, Sugarcane, Mango"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Experience (Years)</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input
                                            disabled={!isEditing}
                                            type="text"
                                            value={profileData.experience}
                                            onChange={(e) => setProfileData({ ...profileData, experience: e.target.value })}
                                            className="w-full pl-12 pr-4 py-3.5 bg-slate-50/50 border border-slate-100 rounded-2xl focus:bg-white focus:border-green-500 transition-all outline-none disabled:opacity-75"
                                            placeholder="e.g., 5 Years"
                                        />
                                    </div>
                                </div>
                            </div>

                            {isEditing && (
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
                                >
                                    {saving ? <Loader2 className="animate-spin" size={20} /> : <><Save size={20} /> Save Profile Changes</>}
                                </button>
                            )}
                        </form>
                    </div>
                </div>

                {/* Account Stats / Sidebar */}
                <div className="space-y-8">
                    <div className="glass-card p-8">
                        <h4 className="font-bold text-slate-900 mb-6 tracking-tight">Farm Activity</h4>
                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                                    <Calendar size={20} />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Joined</p>
                                    <p className="text-sm font-bold text-slate-800">Feb 2026</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center">
                                    <Sprout size={20} />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Scans Run</p>
                                    <p className="text-sm font-bold text-slate-800">12 total scans</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
