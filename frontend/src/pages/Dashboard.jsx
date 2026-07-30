import React, { useState, useEffect } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL
    || (import.meta.env.DEV ? 'http://localhost:8000' : 'https://msme-fastapi-service.onrender.com');
import { useAuth } from '../context/AuthContext';
import MapSelector from '../components/MapSelector';
import DroneSimulator from '../components/DroneSimulator';
import PredictionResult from '../components/PredictionResult';
import {
    Sprout,
    CloudRain,
    Thermometer,
    Droplets,
    Wind,
    Plus,
    ArrowUpRight,
    ShieldCheck,
    Loader2
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';

const mockChartData = [
    { name: 'Mon', health: 50 },
    { name: 'Tue', health: 56 },
    { name: 'Wed', health: 67 },
    { name: 'Thu', health: 78 },
    { name: 'Fri', health: 82 },
    { name: 'Sat', health: 87 },
    { name: 'Sun', health: 96 },
];

export default function Dashboard() {
    const { currentUser } = useAuth();
    const [sensorData, setSensorData] = useState(null);
    const [loadingSensors, setLoadingSensors] = useState(true);
    const [chartData, setChartData] = useState([]);
    const [farms, setFarms] = useState([]);
    const [selectedFarmId, setSelectedFarmId] = useState('');

    useEffect(() => {
        if (currentUser) {
            fetchFarms();
        }
    }, [currentUser]);

    useEffect(() => {
        if (currentUser) {
            fetchSensors();
        }
    }, [currentUser, selectedFarmId]);

    const fetchFarms = async () => {
        try {
            const token = await currentUser?.getIdToken();
            const farmsRes = await fetch(`${API_BASE_URL}/api/farms`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (farmsRes.ok) {
                const data = await farmsRes.json();
                setFarms(data);
                if (data.length > 0 && !selectedFarmId) {
                    setSelectedFarmId(data[0].id || data[0].farm_name);
                }
            }
        } catch (error) {
            console.error("Error fetching farms:", error);
        }
    };

    const fetchSensors = async () => {
        setLoadingSensors(true);
        try {
            const token = await currentUser?.getIdToken();
            const farmParam = selectedFarmId ? `?farm_id=${selectedFarmId}` : '';

            // Fetch current stats
            const sensorRes = await fetch(`${API_BASE_URL}/api/sensors${farmParam}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (sensorRes.ok) {
                const data = await sensorRes.json();
                setSensorData(data);
            }

            // Fetch history for chart
            const historyRes = await fetch(`${API_BASE_URL}/api/sensor-history${farmParam}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (historyRes.ok) {
                const data = await historyRes.json();
                setChartData(data);
            }
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
        } finally {
            setLoadingSensors(false);
        }
    };

    const stats = [
        {
            label: 'Overall Crop Health',
            value: sensorData?.crop_health || (loadingSensors ? '...' : '--'),
            trend: sensorData?.crop_health_trend || '',
            icon: <Sprout className="text-green-600" />,
            color: 'bg-green-100'
        },
        {
            label: 'Soil Moisture',
            value: sensorData?.moisture || (loadingSensors ? '...' : '--'),
            trend: sensorData?.moisture_trend || '',
            icon: <Droplets className="text-blue-600" />,
            color: 'bg-blue-100'
        },
        {
            label: 'Average Temp',
            value: sensorData?.temp || (loadingSensors ? '...' : '--'),
            trend: sensorData?.temp_trend || '',
            icon: <Thermometer className="text-orange-600" />,
            color: 'bg-orange-100'
        },
        {
            label: 'Rainfall Prob.',
            value: sensorData?.rainfall || (loadingSensors ? '...' : '--'),
            trend: sensorData?.rainfall_trend || '',
            icon: <CloudRain className="text-indigo-600" />,
            color: 'bg-indigo-100'
        },
    ];

    return (
        <div className="space-y-8 pb-12">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Farm Intelligence Dashboard</h1>
                    <p className="text-slate-500 mt-1">Real-time health monitoring and historical analysis.</p>
                </div>
                <div className="flex items-center gap-4">
                    {farms.length > 0 && (
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Select Farm</label>
                            <select
                                value={selectedFarmId}
                                onChange={(e) => setSelectedFarmId(e.target.value)}
                                className="px-4 py-2 bg-white border-2 border-slate-100 rounded-xl text-sm font-bold text-slate-900 focus:border-green-500 outline-none transition-all shadow-sm"
                            >
                                {farms.map(farm => (
                                    <option key={farm.id || farm.farm_name} value={farm.id || farm.farm_name}>
                                        {farm.farm_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                    <button className="btn-primary flex items-center gap-2 h-fit mt-auto">
                        <ShieldCheck size={18} /> Health Audit
                    </button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                    <div key={i} className="glass-card p-6 flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <div className={`p-3 rounded-2xl ${stat.color}`}>{stat.icon}</div>
                            {stat.trend && (
                                <span className={`text-xs font-bold px-2 py-1 rounded-lg ${stat.trend.startsWith('+') ? 'bg-green-100 text-green-700' : stat.trend.startsWith('-') ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'}`}>
                                    {stat.trend}
                                </span>
                            )}
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                            <h3 className="text-2xl font-bold text-slate-900">{stat.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Historical Chart */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="glass-card p-6">
                        <h2 className="text-xl font-bold text-slate-900 mb-6">Historical Health Trends</h2>
                        <div className="h-[400px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData.length > 0 ? chartData : mockChartData}>
                                    <defs>
                                        <linearGradient id="colorHealth" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                                    <YAxis hide />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Area type="monotone" dataKey="health" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorHealth)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Right Sidebar - Quick Insights */}
                <div className="space-y-6">
                    <div className="glass-card p-6 bg-slate-900 text-white border-none overflow-hidden relative">
                        <div className="relative z-10">
                            <h3 className="text-lg font-bold mb-2">Smart Recommendation</h3>
                            <p className="text-slate-300 text-sm leading-relaxed">
                                Soil moisture in Zone B is slightly below optimal. Consider localized irrigation in the next 24 hours to maintain peak health.
                            </p>
                        </div>
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Droplets size={80} />
                        </div>
                    </div>

                    <div className="glass-card p-6">
                        <h3 className="font-bold text-slate-900 mb-4">Farm Summary</h3>
                        <div className="space-y-4">
                            {[
                                { label: 'Active Zones', value: `${farms.length} Fields` },
                                { label: 'Sensors Online', value: '12 Units' },
                                { label: 'Total Scans (Mo)', value: '284' }
                            ].map((item, id) => (
                                <div key={id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                                    <span className="text-xs text-slate-500 font-medium">{item.label}</span>
                                    <span className="text-xs text-slate-900 font-bold">{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
