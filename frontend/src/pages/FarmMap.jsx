import React, { useState, useEffect, useCallback, useMemo } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL
    || (import.meta.env.DEV ? 'http://localhost:8000' : 'https://msme-fastapi-service.onrender.com');
import { useAuth } from '../context/AuthContext';
import MapSelector from '../components/MapSelector';
import DroneSimulator from '../components/DroneSimulator';
import PredictionResult from '../components/PredictionResult';
import useSensorReadings from '../hooks/useSensorReadings';
import {
    Sprout,
    Wind,
    Plus,
    ShieldCheck,
    Loader2,
    Map as MapIcon,
    Sparkles,
    RotateCcw,
    Video,
    Film,
    MapPin,
    AlertTriangle,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    Trash2,
    Eye,
    LayoutList,
    Search,
    Navigation,
    Pencil,
    XCircle,
    Save,
    Cpu,
    X
} from 'lucide-react';

export default function FarmMap() {
    const { currentUser } = useAuth();
    const [selectedAreas, setSelectedAreas] = useState([]);
    const [savedFarms, setSavedFarms] = useState([]);
    const [activePointCount, setActivePointCount] = useState(0);
    const [isScanning, setIsScanning] = useState(false);
    const [prediction, setPrediction] = useState(null);
    const [cropType, setCropType] = useState('cotton');
    const [uploadedImage, setUploadedImage] = useState(null);
    const [savingField, setSavingField] = useState(false);
    const [farmName, setFarmName] = useState('');
    const [showNameModal, setShowNameModal] = useState(false);
    const [showGuide, setShowGuide] = useState(true);

    // --- Drawing Mode State ---
    const [isDrawing, setIsDrawing] = useState(false);

    // --- Search State ---
    const [searchQuery, setSearchQuery] = useState('');

    // --- Video Upload State ---
    const [uploadMode, setUploadMode] = useState('image'); // 'image' | 'video'
    const [videoFile, setVideoFile] = useState(null);
    const [srtFile, setSrtFile] = useState(null);
    const [isAnalyzingVideo, setIsAnalyzingVideo] = useState(false);
    const [videoProgress, setVideoProgress] = useState('');
    const [videoResults, setVideoResults] = useState(null);
    const [expandedResult, setExpandedResult] = useState(null);

    // --- Map selection + highlight state ---
    const [selectedFarmId, setSelectedFarmId] = useState(null);
    const [flyToCoords, setFlyToCoords] = useState(null);

    // --- Edit Mode State ---
    const [editingFarm, setEditingFarm] = useState(null);
    const [editAreas, setEditAreas] = useState([]);

    // --- Sensor Form State ---
    const [sensorFormFarmId, setSensorFormFarmId] = useState(null);
    const [expandedFarmId, setExpandedFarmId] = useState(null);
    const [editingSensorId, setEditingSensorId] = useState(null);   // null = add mode, string = editing
    const [editingSensorFarmId, setEditingSensorFarmId] = useState(null);
    const [sensorFormData, setSensorFormData] = useState({
        sensorName: '', sensorNodeId: '', installationDate: '', notes: ''
    });

    // --- Live sensor readings ---
    const allSensorNodeIds = useMemo(() => {
        const ids = [];
        savedFarms.forEach(farm => {
            (farm.sensors || []).forEach(s => {
                if (s.sensorNodeId) ids.push(s.sensorNodeId);
            });
        });
        return ids;
    }, [savedFarms]);
    const { readings: sensorReadings } = useSensorReadings(allSensorNodeIds);

    useEffect(() => {
        if (currentUser) {
            fetchSavedFarms();
        }
    }, [currentUser]);

    const fetchSavedFarms = async () => {
        try {
            const token = await currentUser?.getIdToken();
            const response = await fetch(`${API_BASE_URL}/api/farms`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const farms = await response.json();
                setSavedFarms(farms);
            }
        } catch (error) {
            console.error("Error fetching saved farms:", error);
        }
    };

    const handleAddField = async () => {
        if (selectedAreas.length > 0) {
            if (!farmName.trim()) {
                setShowNameModal(true);
                return;
            }
            setSavingField(true);
            try {
                const token = await currentUser?.getIdToken();
                const response = await fetch(`${API_BASE_URL}/api/area`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        farmName: farmName || 'Unnamed Farm',
                        areas: selectedAreas,
                        sensors: []
                    })
                });
                if (response.ok) {
                    alert(`Farm '${farmName || 'Unnamed Farm'}' saved successfully!`);
                    setShowNameModal(false);
                    setFarmName('');
                    setSelectedAreas([]);
                    fetchSavedFarms();
                }
            } catch (error) {
                console.error("Error saving area:", error);
                alert("Failed to save area. Please try again.");
            } finally {
                setSavingField(false);
            }
        }
    };

    // ── Sensor form helpers ─────────────────────────────────────────────────────
    const resetSensorForm = useCallback(() => {
        setSensorFormFarmId(null);
        setEditingSensorId(null);
        setEditingSensorFarmId(null);
        setSensorFormData({ sensorName: '', sensorNodeId: '', installationDate: '', notes: '' });
    }, []);

    const openEditSensor = useCallback((farmId, sensor) => {
        setEditingSensorId(sensor.id);
        setEditingSensorFarmId(farmId);
        setSensorFormFarmId(farmId);
        setSensorFormData({
            sensorName: sensor.sensorName || '',
            sensorNodeId: sensor.sensorNodeId || '',
            installationDate: sensor.installationDate || '',
            notes: sensor.notes || '',
        });
    }, []);

    // ── Sensor form handlers (metadata-based) ──────────────────────────────────
    const handleSaveSensor = useCallback(async () => {
        const farmId = sensorFormFarmId;
        const farm = savedFarms.find(f => f.id === farmId);
        if (!farm) return;

        let updatedSensors;
        if (editingSensorId) {
            // Edit existing sensor
            updatedSensors = (farm.sensors || []).map(s =>
                s.id === editingSensorId
                    ? { ...s, sensorName: sensorFormData.sensorName, notes: sensorFormData.notes, installationDate: sensorFormData.installationDate, sensorNodeId: sensorFormData.sensorNodeId }
                    : s
            );
        } else {
            // Add new sensor — auto-set installationDate to today
            const newSensor = {
                ...sensorFormData,
                installationDate: sensorFormData.installationDate || new Date().toISOString().split('T')[0],
                id: `S-${Date.now()}`,
            };
            updatedSensors = [...(farm.sensors || []), newSensor];
        }

        try {
            const token = await currentUser?.getIdToken();
            const res = await fetch(`${API_BASE_URL}/api/farms/${farm.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ farmName: farm.farm_name, areas: farm.areas, sensors: updatedSensors }),
            });
            if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.detail || 'Failed'); }
            fetchSavedFarms();
            resetSensorForm();
        } catch (e) {
            console.error('Save sensor failed:', e);
            alert(`Could not save sensor: ${e.message}`);
        }
    }, [savedFarms, sensorFormFarmId, sensorFormData, editingSensorId, currentUser, fetchSavedFarms, resetSensorForm]);

    const handleDeleteSensorFromFarm = useCallback(async (farmId, sensorId) => {
        const farm = savedFarms.find(f => f.id === farmId);
        if (!farm) return;
        const updatedSensors = (farm.sensors || []).filter(s => s.id !== sensorId);
        try {
            const token = await currentUser?.getIdToken();
            const res = await fetch(`${API_BASE_URL}/api/farms/${farm.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ farmName: farm.farm_name, areas: farm.areas, sensors: updatedSensors }),
            });
            if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.detail || 'Failed'); }
            fetchSavedFarms();
        } catch (e) {
            console.error('Delete sensor failed:', e);
            alert(`Could not delete sensor: ${e.message}`);
        }
    }, [savedFarms, currentUser, fetchSavedFarms]);


    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setUploadedImage(reader.result);
                setPrediction(null);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleVideoAnalysis = async () => {
        if (!videoFile) { alert('Please select a drone video file.'); return; }
        setIsAnalyzingVideo(true);
        setVideoResults(null);
        setVideoProgress('Uploading files...');
        try {
            const token = await currentUser?.getIdToken();
            const formData = new FormData();
            formData.append('video', videoFile);
            if (srtFile) formData.append('srt', srtFile);
            formData.append('crop_type', cropType);
            formData.append('interval_sec', '5');

            setVideoProgress('Extracting frames & running AI analysis...');
            const response = await fetch(`${API_BASE_URL}/api/upload-video`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData,
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.detail || 'Upload failed');
            setVideoResults(data);
            setVideoProgress('');
        } catch (err) {
            console.error('Video analysis error:', err);
            setVideoProgress('');
            alert(`Video analysis failed: ${err.message}`);
        } finally {
            setIsAnalyzingVideo(false);
        }
    };

    const handleAreaSelect = useCallback((coordinates) => {
        if (coordinates) {
            if (coordinates.length >= 3) {
                const normalizedCoords = coordinates.map(p => ({
                    lat: p.lat ?? p[0],
                    lng: p.lng ?? p[1],
                }));
                setSelectedAreas(prev => [...prev, { id: Date.now(), coordinates: normalizedCoords }]);
                setIsDrawing(false);
            } else {
                console.warn("Invalid point count for farm area:", coordinates.length);
            }
        } else {
            setSelectedAreas([]);
        }
    }, []);

    const handleViewOnMap = useCallback((farm) => {
        // Collect all coordinates from all areas of this farm
        const allCoords = (farm.areas || []).flatMap(a => a.coordinates || []);
        if (!allCoords.length) return;
        setSelectedFarmId(farm.id);
        // Pass a fresh array reference each time so MapSelector's useEffect always fires
        setFlyToCoords([...allCoords]);
    }, []);

    const handleDeleteFarm = useCallback(async (farmId) => {
        if (!window.confirm('Delete this farm permanently?')) return;
        try {
            const token = await currentUser?.getIdToken();
            const res = await fetch(`${API_BASE_URL}/api/farms/${farmId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.detail || 'Delete failed');
            }
            // Clear highlight if this farm was selected
            if (selectedFarmId === farmId) {
                setSelectedFarmId(null);
                setFlyToCoords(null);
            }
            // Refresh the saved farms list
            fetchSavedFarms();
        } catch (e) {
            console.error('Delete failed:', e);
            alert(`Could not delete farm: ${e.message}`);
        }
    }, [currentUser, selectedFarmId, fetchSavedFarms]);

    // ── Edit Handlers ─────────────────────────────────────────────────────────
    const handleEditFarm = useCallback((farm) => {
        setEditingFarm(farm);
        setEditAreas(farm.areas ? [...farm.areas] : []);
        setSelectedFarmId(farm.id);
        const allCoords = (farm.areas || []).flatMap(a => a.coordinates || []);
        if (allCoords.length) setFlyToCoords([...allCoords]);
        setSelectedAreas([]);
        setIsDrawing(false);
    }, []);

    const handleCancelEdit = useCallback(() => {
        setEditingFarm(null);
        setEditAreas([]);
        setSelectedFarmId(null);
        setFlyToCoords(null);
    }, []);

    const handleSaveEdit = useCallback(async () => {
        if (!editingFarm) return;
        try {
            const token = await currentUser?.getIdToken();
            const res = await fetch(`${API_BASE_URL}/api/farms/${editingFarm.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    farmName: editingFarm.farm_name,
                    areas: editAreas.length ? editAreas : editingFarm.areas,
                    sensors: editingFarm.sensors || [],
                }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.detail || 'Update failed');
            }
            alert(`Farm '${editingFarm.farm_name}' updated successfully!`);
            handleCancelEdit();
            fetchSavedFarms();
        } catch (e) {
            console.error('Update failed:', e);
            alert(`Could not save changes: ${e.message}`);
        }
    }, [currentUser, editingFarm, editAreas, handleCancelEdit, fetchSavedFarms]);

    const handleSearch = () => {
        if (!searchQuery.trim()) return;
        const parts = searchQuery.split(',').map(p => p.trim());
        if (parts.length === 2) {
            const lat = parseFloat(parts[0]);
            const lng = parseFloat(parts[1]);
            if (!isNaN(lat) && !isNaN(lng)) {
                setFlyToCoords([{ lat, lng }]);
                setSelectedFarmId(null); // Clear highlight when searching new area
            } else {
                alert("Invalid Latitude or Longitude values.");
            }
        } else {
            alert("Please enter coordinates as: latitude, longitude");
        }
    };

    const handleScan = async () => {
        if (selectedAreas.length === 0) return;
        setIsScanning(true);
    };

    const handleScanComplete = async (image) => {
        setIsScanning(false);
        try {
            const response = await fetch(`${API_BASE_URL}/api/predict`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${await currentUser?.getIdToken()}`
                },
                body: JSON.stringify({
                    crop_type: cropType,
                    image: image
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setPrediction({
                    status: 'Error',
                    prediction: 'Auth/Service Error: ' + (data.detail || data.error || 'Unknown'),
                    confidence: 0,
                    recommendation: 'Please ensure you are logged in and backend is optimized.'
                });
                return;
            }

            setPrediction(data.error ? {
                status: 'Error',
                prediction: 'ML Error: ' + data.error,
                confidence: 0,
                recommendation: 'Check if model files are present.'
            } : data);

        } catch (err) {
            console.error("Prediction failed:", err);
            setPrediction({
                status: 'Error',
                prediction: 'Connection Failed',
                confidence: 0,
                recommendation: 'Ensure backend is running.'
            });
        }
    };

    const handleAreaEdited = useCallback((farmId, newCoordinates) => {
        if (!editingFarm || editingFarm.id !== farmId) return;
        setEditAreas([{ coordinates: newCoordinates }]);
    }, [editingFarm]);

    const combinedAreas = React.useMemo(() => {
        if (editingFarm) {
            // Show other farms normally; show the edited farm with editAreas
            const otherFarms = savedFarms
                .filter(f => f.id !== editingFarm.id)
                .flatMap(farm =>
                    (farm.areas || []).map(area => ({
                        ...area,
                        id: farm.id,
                        farm_name: farm.farm_name || 'Unnamed Farm',
                        sensors: farm.sensors || [],
                    }))
                );
            const editFarmAreas = (editAreas.length ? editAreas : editingFarm.areas || []).map(area => ({
                ...area,
                id: editingFarm.id,
                farm_name: editingFarm.farm_name || 'Unnamed Farm',
                sensors: editingFarm.sensors || [],
            }));
            return [...selectedAreas, ...otherFarms, ...editFarmAreas];
        }
        // Normal mode
        const active = selectedAreas;
        const saved = savedFarms.flatMap(farm =>
            (farm.areas || []).map(area => ({
                ...area,
                id: farm.id,
                farm_name: farm.farm_name || 'Unnamed Farm',
                sensors: farm.sensors || [],
            }))
        );
        return [...active, ...saved];
    }, [selectedAreas, savedFarms, editingFarm, editAreas]);


    return (
        <div className="space-y-8 pb-12">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Farm Map & Operations</h1>
                    <p className="text-slate-500 mt-1">Mark fields, manage sensors, and run AI drone scans.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => {
                            setIsDrawing(prev => !prev);
                            if (!isDrawing) {
                                setSelectedAreas([]);
                                setSelectedFarmId(null);
                                setFlyToCoords(null);
                            }
                        }}
                        className={`px-4 py-2 flex items-center gap-2 font-bold text-xs uppercase rounded-xl border transition-all ${isDrawing
                            ? 'bg-red-500 text-white border-red-500 shadow-lg shadow-red-200 animate-pulse'
                            : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border-indigo-100'
                            }`}
                    >
                        <Pencil size={16} />
                        {isDrawing ? 'Stop Drawing' : 'Draw Field'}
                    </button>
                    <button
                        onClick={() => {
                            if (selectedAreas.length > 0) {
                                setShowNameModal(true);
                            } else {
                                handleAddField();
                            }
                        }}
                        disabled={savingField || selectedAreas.length === 0}
                        className="px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-700 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-xs uppercase rounded-xl shadow-lg shadow-emerald-100"
                    >
                        {savingField ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                        Save New Field
                    </button>
                    {selectedFarmId && !editingFarm && (
                        <>
                            <button
                                onClick={() => {
                                    const farm = savedFarms.find(f => f.id === selectedFarmId);
                                    if (farm) handleEditFarm(farm);
                                }}
                                className="px-4 py-2 bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors flex items-center gap-2 font-bold text-xs uppercase rounded-xl border border-amber-100"
                            >
                                <Pencil size={16} />
                                Edit Field
                            </button>
                            <button
                                onClick={() => handleDeleteFarm(selectedFarmId)}
                                className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 transition-colors flex items-center gap-2 font-bold text-xs uppercase rounded-xl border border-red-100"
                            >
                                <Trash2 size={16} />
                                Delete Field
                            </button>
                        </>
                    )}
                    {editingFarm && (
                        <>
                            <button
                                onClick={handleSaveEdit}
                                className="px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-700 transition-all flex items-center gap-2 font-bold text-xs uppercase rounded-xl shadow-lg shadow-emerald-100"
                            >
                                <Save size={16} />
                                Save Changes
                            </button>
                            <button
                                onClick={handleCancelEdit}
                                className="px-4 py-2 bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors flex items-center gap-2 font-bold text-xs uppercase rounded-xl border border-slate-200"
                            >
                                Cancel Edit
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Map Section */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="glass-card overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-slate-900">Field Analysis Map</h2>
                            <div className="flex gap-2">
                                <span className="flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full">
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                    Drones Active
                                </span>
                            </div>
                        </div>
                        <div className="h-[500px] w-full relative group">
                            {/* SEARCH OVERLAY */}
                            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1100] w-full max-w-sm px-4 pointer-events-none">
                                <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/50 p-1.5 flex items-center gap-2 pointer-events-auto">
                                    <div className="pl-3 text-slate-400">
                                        <Search size={16} />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Enter Lat, Lon (e.g. 11.1271, 78.6569)"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                        className="flex-1 bg-transparent border-none outline-none text-xs font-semibold text-slate-700 placeholder:text-slate-400 py-2"
                                    />
                                    <button
                                        onClick={handleSearch}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-xl transition-all shadow-lg shadow-indigo-100"
                                    >
                                        <Navigation size={14} />
                                    </button>
                                </div>
                            </div>

                            <MapSelector
                                onAreaSelect={handleAreaSelect}
                                onAreaEdited={handleAreaEdited}
                                onVertexAdd={setActivePointCount}
                                onDeletedFarm={handleDeleteFarm}
                                onEditFarm={handleEditFarm}
                                onAddSensor={(farmId) => setSensorFormFarmId(farmId)}
                                sensorReadings={sensorReadings}
                                savedFarms={savedFarms}
                                areas={combinedAreas}
                                isDrawing={isDrawing}
                                flyToCoords={flyToCoords}
                                highlightAreaId={selectedFarmId}
                            />

                            {/* Selection Progress Indicator - Bottom Center */}
                            {activePointCount > 0 && (
                                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-3 bg-slate-900/90 backdrop-blur-md px-6 py-3 rounded-full border border-slate-700 shadow-2xl animate-fade-in transition-all duration-300 pointer-events-none">
                                    <div className="flex gap-1.5 items-center">
                                        <div className="w-3 h-3 rounded-full bg-green-500 border-2 border-green-400 shadow-[0_0_15px_rgba(34,197,94,0.6)] animate-pulse" />
                                        <span className="text-white font-bold text-xs">{activePointCount} Points Marked</span>
                                    </div>
                                    <div className="h-5 w-[1px] bg-white/20 mx-1" />
                                    <div className="flex flex-col">
                                        <p className="text-white font-bold text-xs tracking-wide uppercase leading-none mb-0.5">
                                            {activePointCount >= 3
                                                ? "Click first point to close field"
                                                : `Mark Point ${activePointCount + 1}`}
                                        </p>
                                        <p className="text-slate-400 text-[9px] font-medium leading-none">
                                            {activePointCount >= 3 ? "Area is valid (3+ points)" : "At least 3 points required"}
                                        </p>
                                    </div>
                                </div>
                            )}

                        </div>

                        {/* Coordinates List Panel */}
                        {(selectedFarmId || selectedAreas.length > 0) && (
                            <div className="p-4 bg-slate-900 text-emerald-400 border-t border-slate-800 font-mono text-[10px] overflow-x-auto">
                                <p className="text-slate-500 font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <MapPin size={12} /> Live Coordinate Stream
                                </p>
                                <div className="max-h-24 overflow-y-auto">
                                    <pre>
                                        {JSON.stringify(
                                            selectedFarmId
                                                ? savedFarms.find(f => f.id === selectedFarmId)?.areas[0]?.coordinates
                                                : selectedAreas[0]?.coordinates,
                                            null,
                                            2
                                        )}
                                    </pre>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ── Saved Fields Panel ────────────────────────────────── */}
                    <div className="glass-card overflow-hidden">
                        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-50 text-green-600 rounded-xl">
                                    <LayoutList size={18} />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-slate-900">Saved Fields</h2>
                                    <p className="text-xs text-slate-400">{savedFarms.length} farm{savedFarms.length !== 1 ? 's' : ''} stored</p>
                                </div>
                            </div>
                            {selectedFarmId && (
                                <button
                                    onClick={() => { setSelectedFarmId(null); setFlyToCoords(null); }}
                                    className="text-xs text-amber-600 font-bold px-3 py-1.5 bg-amber-50 rounded-xl hover:bg-amber-100 transition-all"
                                >
                                    Clear Selection
                                </button>
                            )}
                        </div>

                        {savedFarms.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 gap-3 text-slate-400">
                                <MapIcon size={28} strokeWidth={1.5} />
                                <p className="text-sm font-medium">No fields saved yet</p>
                                <p className="text-xs">Draw a polygon on the map and save it.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-50">
                                {savedFarms.map((farm) => {
                                    const isSelected = selectedFarmId === farm.id;
                                    const hasCoords = (farm.areas || []).some(a => a.coordinates?.length);
                                    const isExpanded = expandedFarmId === farm.id;
                                    const farmSensors = farm.sensors || [];
                                    return (
                                        <div key={farm.id} className="transition-all">
                                            <div
                                                className={`flex items-center justify-between px-5 py-4 cursor-pointer ${isSelected ? 'bg-amber-50 border-l-4 border-amber-400' : 'hover:bg-slate-50 border-l-4 border-transparent'}`}
                                                onClick={() => setExpandedFarmId(isExpanded ? null : farm.id)}
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${isSelected ? 'bg-amber-400 animate-pulse' : 'bg-green-400'}`} />
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-bold text-slate-900 truncate">{farm.farm_name || 'Unnamed Farm'}</p>
                                                        <p className="text-[10px] text-slate-400 mt-0.5">
                                                            {(farm.areas || []).length} area{(farm.areas || []).length !== 1 ? 's' : ''}
                                                            {farmSensors.length > 0 && ` · ${farmSensors.length} sensor${farmSensors.length !== 1 ? 's' : ''}`}
                                                            {farm.created_at ? ` · ${new Date(farm.created_at).toLocaleDateString()}` : ''}
                                                        </p>
                                                    </div>
                                                    {isExpanded ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                                                </div>
                                                <div className="flex items-center gap-2 ml-3 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                                                    <button
                                                        onClick={() => handleViewOnMap(farm)}
                                                        disabled={!hasCoords || !!editingFarm}
                                                        title="View on map"
                                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${isSelected && !editingFarm
                                                            ? 'bg-amber-400 text-white shadow-sm'
                                                            : 'bg-green-50 text-green-700 hover:bg-green-100 disabled:opacity-40 disabled:cursor-not-allowed'
                                                            }`}
                                                    >
                                                        <Eye size={13} />
                                                        {isSelected && !editingFarm ? 'Viewing' : 'View'}
                                                    </button>
                                                    <button
                                                        onClick={() => handleEditFarm(farm)}
                                                        disabled={!!editingFarm && editingFarm.id !== farm.id}
                                                        title="Edit this farm"
                                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${editingFarm?.id === farm.id
                                                            ? 'bg-amber-400 text-white shadow-sm'
                                                            : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 disabled:opacity-40 disabled:cursor-not-allowed'
                                                            }`}
                                                    >
                                                        <Pencil size={13} />
                                                        {editingFarm?.id === farm.id ? 'Editing' : 'Edit'}
                                                    </button>
                                                    <button
                                                        onClick={() => setSensorFormFarmId(farm.id)}
                                                        disabled={!!editingFarm}
                                                        title="Add sensor"
                                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-violet-50 text-violet-600 hover:bg-violet-100 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                                    >
                                                        <Cpu size={13} />
                                                        Add Sensor
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteFarm(farm.id)}
                                                        disabled={!!editingFarm}
                                                        title="Delete farm"
                                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-red-50 text-red-600 hover:bg-red-100 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                                    >
                                                        <Trash2 size={13} />
                                                    </button>
                                                </div>
                                            </div>
                                            {/* ── Expanded: sensor list ── */}
                                            {isExpanded && (
                                                <div className="px-5 pb-4 bg-slate-50/50">
                                                    {farmSensors.length === 0 ? (
                                                        <p className="text-xs text-slate-400 italic py-2">No sensors attached. Click "Add Sensor" to add one.</p>
                                                    ) : (
                                                        <div className="space-y-2 pt-1">
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sensors</p>
                                                            {farmSensors.map(s => {
                                                                const r = s.sensorNodeId ? sensorReadings[s.sensorNodeId] : null;
                                                                return (
                                                                    <div key={s.id} className="px-3 py-2.5 bg-white rounded-xl border border-slate-100 shadow-sm">
                                                                        <div className="flex items-center justify-between">
                                                                            <div className="flex items-center gap-3">
                                                                                <div className="w-8 h-8 rounded-lg bg-violet-100 text-violet-600 flex items-center justify-center">
                                                                                    <Cpu size={14} />
                                                                                </div>
                                                                                <div>
                                                                                    <p className="text-xs font-bold text-slate-900">{s.sensorName || 'Unnamed'}</p>
                                                                                    {s.sensorNodeId && <p className="text-[9px] text-slate-400">Node: {s.sensorNodeId}</p>}
                                                                                </div>
                                                                            </div>
                                                                            <div className="flex items-center gap-1">
                                                                                <button
                                                                                    onClick={() => openEditSensor(farm.id, s)}
                                                                                    className="text-indigo-400 hover:text-indigo-600 transition-colors p-1"
                                                                                    title="Edit sensor"
                                                                                >
                                                                                    <Pencil size={12} />
                                                                                </button>
                                                                                <button
                                                                                    onClick={() => handleDeleteSensorFromFarm(farm.id, s.id)}
                                                                                    className="text-red-400 hover:text-red-600 transition-colors p-1"
                                                                                    title="Remove sensor"
                                                                                >
                                                                                    <Trash2 size={12} />
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                        {/* Live readings */}
                                                                        {r ? (
                                                                            <div className="mt-2 ml-11 flex flex-wrap gap-1.5">
                                                                                {r.temperature != null && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 text-[10px] font-bold">🌡 {r.temperature}°C</span>}
                                                                                {r.ph != null && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold">💧 pH {r.ph}</span>}
                                                                                {r.nitrogen != null && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 text-green-700 text-[10px] font-bold">N {r.nitrogen}</span>}
                                                                                {r.phosphorous != null && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold">P {r.phosphorous}</span>}
                                                                                {r.potassium != null && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 text-[10px] font-bold">K {r.potassium}</span>}
                                                                            </div>
                                                                        ) : s.sensorNodeId ? (
                                                                            <p className="mt-1.5 ml-11 text-[10px] text-slate-400 italic">Waiting for sensor data...</p>
                                                                        ) : null}
                                                                        <div className="mt-1.5 ml-11 space-y-0.5">
                                                                            {s.installationDate && <p className="text-[10px] text-slate-500">Installed: <span className="font-semibold text-slate-700">{s.installationDate}</span></p>}
                                                                            {s.notes && <p className="text-[10px] text-slate-500 italic">{s.notes}</p>}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Edit Mode Banner */}
                    {editingFarm && (
                        <div className="glass-card p-5 border-2 border-amber-400 bg-amber-50 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-amber-100 text-amber-600 rounded-xl">
                                        <Pencil size={16} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-extrabold text-slate-900">Editing: {editingFarm.farm_name}</p>
                                        <p className="text-[10px] text-slate-500">Drag vertices to adjust, then save.</p>
                                    </div>
                                </div>
                                <button onClick={handleCancelEdit}
                                    className="text-slate-400 hover:text-red-500 transition-colors">
                                    <XCircle size={20} />
                                </button>
                            </div>

                            <div className="flex gap-2 pt-1">
                                <button onClick={handleCancelEdit}
                                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl transition-all">
                                    Cancel
                                </button>
                                <button onClick={handleSaveEdit}
                                    className="flex-[2] py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 shadow-md shadow-amber-100">
                                    <Save size={13} /> Save Changes
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Operations Panel */}
                <div className="space-y-8">
                    <div className="glass-card p-6 space-y-6">
                        <h2 className="text-xl font-bold text-slate-900">Analyze Crops</h2>

                        {/* Crop Selector */}
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-slate-700">Crop Category</label>
                            <select
                                value={cropType}
                                onChange={(e) => {
                                    setCropType(e.target.value);
                                    // Clear stale results so the user never sees results from a different crop
                                    setPrediction(null);
                                    setUploadedImage(null);
                                    setVideoResults(null);
                                }}
                                className="w-full px-4 py-3 bg-slate-50 border-transparent rounded-2xl focus:bg-white focus:ring-4 focus:ring-green-500/5 transition-all text-sm font-medium outline-none"
                            >
                                <option value="cotton">Cotton</option>
                                <option value="guava">Guava</option>
                                <option value="sugarcane">Sugarcane</option>
                                <option value="rice">Rice</option>
                                <option value="tomato">Tomato</option>
                                <option value="brinjal">Brinjal</option>
                            </select>
                        </div>

                        {/* Mode Toggle */}
                        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl">
                            <button
                                onClick={() => setUploadMode('image')}
                                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${uploadMode === 'image'
                                    ? 'bg-white shadow-md text-slate-900'
                                    : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                <Film size={14} /> Image / Scan
                            </button>
                            <button
                                onClick={() => setUploadMode('video')}
                                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${uploadMode === 'video'
                                    ? 'bg-white shadow-md text-slate-900'
                                    : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                <Video size={14} /> Drone Video
                            </button>
                        </div>

                        {/* ---- IMAGE / SCAN MODE ---- */}
                        {uploadMode === 'image' && (
                            <div className="space-y-4">
                                <div className={`p-4 rounded-2xl border-2 transition-all group ${selectedAreas.length > 0 ? 'border-green-100 bg-green-50/50' : 'border-slate-100 bg-slate-50 opacity-60'}`}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-xl bg-white shadow-sm ${selectedAreas.length > 0 ? 'text-green-600' : 'text-slate-400'}`}>
                                                <Wind size={20} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900">Drone Sim</p>
                                                <p className="text-xs text-slate-500">Autonomous Scan</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={handleScan}
                                            disabled={selectedAreas.length === 0 || isScanning}
                                            className={`btn-primary !px-4 !py-1.5 !text-xs !rounded-xl ${selectedAreas.length === 0 && 'cursor-not-allowed opacity-50'}`}
                                        >
                                            {isScanning ? 'Scanning...' : 'Launch'}
                                        </button>
                                    </div>
                                </div>

                                <div className="relative flex py-2 items-center">
                                    <div className="flex-grow border-t border-slate-100"></div>
                                    <span className="flex-shrink mx-4 text-xs font-bold text-slate-400">OR</span>
                                    <div className="flex-grow border-t border-slate-100"></div>
                                </div>

                                <div className="border-2 border-dashed border-slate-100 rounded-2xl p-6 flex flex-col items-center justify-center hover:bg-slate-50 transition-all hover:border-green-300">
                                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" id="image-upload" />
                                    <label htmlFor="image-upload" className="cursor-pointer flex flex-col items-center text-center">
                                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md text-slate-400 mb-3">
                                            <Plus size={24} />
                                        </div>
                                        <span className="text-sm font-bold text-slate-900">Upload Image</span>
                                        <span className="text-xs text-slate-500 mt-1">Manual Capture</span>
                                    </label>
                                    {uploadedImage && (
                                        <div className="mt-4 relative group">
                                            <img src={uploadedImage} alt="Preview" className="h-24 w-24 object-cover rounded-xl shadow-lg" />
                                            <button onClick={() => setUploadedImage(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-lg">×</button>
                                        </div>
                                    )}
                                </div>
                                {uploadedImage && !isScanning && (
                                    <button onClick={() => handleScanComplete(uploadedImage)} className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-2xl font-bold shadow-lg shadow-green-200 transition-all">
                                        Process Image
                                    </button>
                                )}
                            </div>
                        )}

                        {/* ---- VIDEO / SRT MODE ---- */}
                        {uploadMode === 'video' && (
                            <div className="space-y-4">
                                {/* Video File Picker */}
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">Drone Video</label>
                                    <label
                                        htmlFor="video-upload"
                                        className={`flex items-center gap-3 p-4 rounded-2xl border-2 border-dashed cursor-pointer transition-all ${videoFile ? 'border-indigo-200 bg-indigo-50' : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                                            }`}
                                    >
                                        <div className={`p-2 rounded-xl ${videoFile ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                                            <Video size={18} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            {videoFile ? (
                                                <>
                                                    <p className="text-sm font-bold text-slate-900 truncate">{videoFile.name}</p>
                                                    <p className="text-xs text-slate-400">{(videoFile.size / 1024 / 1024).toFixed(1)} MB</p>
                                                </>
                                            ) : (
                                                <>
                                                    <p className="text-sm font-bold text-slate-700">Select video file</p>
                                                    <p className="text-xs text-slate-400">.mp4, .avi, .mov, .mkv</p>
                                                </>
                                            )}
                                        </div>
                                        {videoFile && <button onClick={(e) => { e.preventDefault(); setVideoFile(null); }} className="text-slate-400 hover:text-red-500 transition-colors">×</button>}
                                    </label>
                                    <input id="video-upload" type="file" accept="video/*,.mp4,.avi,.mov,.mkv" className="hidden" onChange={(e) => { setVideoFile(e.target.files[0] || null); setVideoResults(null); }} />
                                </div>

                                {/* SRT File Picker */}
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">
                                        GPS Telemetry <span className="normal-case font-normal">(optional .srt)</span>
                                    </label>
                                    <label
                                        htmlFor="srt-upload"
                                        className={`flex items-center gap-3 p-4 rounded-2xl border-2 border-dashed cursor-pointer transition-all ${srtFile ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 hover:border-emerald-300 hover:bg-slate-50'
                                            }`}
                                    >
                                        <div className={`p-2 rounded-xl ${srtFile ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                            <MapPin size={18} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            {srtFile ? (
                                                <>
                                                    <p className="text-sm font-bold text-slate-900 truncate">{srtFile.name}</p>
                                                    <p className="text-xs text-slate-400">GPS coordinates will be mapped</p>
                                                </>
                                            ) : (
                                                <>
                                                    <p className="text-sm font-bold text-slate-700">Select .srt GPS file</p>
                                                    <p className="text-xs text-slate-400">DJI drone telemetry format</p>
                                                </>
                                            )}
                                        </div>
                                        {srtFile && <button onClick={(e) => { e.preventDefault(); setSrtFile(null); }} className="text-slate-400 hover:text-red-500 transition-colors">×</button>}
                                    </label>
                                    <input id="srt-upload" type="file" accept=".srt" className="hidden" onChange={(e) => { setSrtFile(e.target.files[0] || null); setVideoResults(null); }} />
                                </div>

                                {/* Analyze Button */}
                                <button
                                    onClick={handleVideoAnalysis}
                                    disabled={!videoFile || isAnalyzingVideo}
                                    className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 rounded-2xl font-bold shadow-lg shadow-indigo-200 transition-all"
                                >
                                    {isAnalyzingVideo ? (
                                        <><Loader2 size={18} className="animate-spin" /> {videoProgress || 'Analyzing...'}</>
                                    ) : (
                                        <><Video size={18} /> Analyze Drone Video</>
                                    )}
                                </button>

                                {/* Video Results List */}
                                {videoResults && (
                                    <div className="space-y-3 pt-2">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-bold text-slate-900">
                                                {videoResults.total_frames_analyzed} Frames Analyzed
                                            </p>
                                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${videoResults.has_gps ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                                {videoResults.has_gps ? '📍 GPS Active' : 'No GPS'}
                                            </span>
                                        </div>
                                        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                                            {videoResults.results.map((r, i) => (
                                                <div key={i} className={`p-3 rounded-xl border transition-all cursor-pointer ${expandedResult === i ? 'border-indigo-200 bg-indigo-50' : 'border-slate-100 bg-slate-50 hover:border-indigo-100'
                                                    }`} onClick={() => setExpandedResult(expandedResult === i ? null : i)}>
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            {r.status === 'Healthy' || r.status === 'Healthy Plant'
                                                                ? <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                                                                : <AlertTriangle size={14} className="text-amber-500 shrink-0" />
                                                            }
                                                            <div>
                                                                <p className="text-xs font-bold text-slate-900">{r.prediction}</p>
                                                                <p className="text-[10px] text-slate-400">{r.timestamp_sec}s • {r.confidence}% conf.</p>
                                                            </div>
                                                        </div>
                                                        {expandedResult === i ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                                                    </div>
                                                    {expandedResult === i && (
                                                        <div className="mt-2 pt-2 border-t border-slate-200 space-y-1">
                                                            {r.latitude && <p className="text-[10px] text-slate-500">📍 {r.latitude?.toFixed(5)}, {r.longitude?.toFixed(5)}</p>}
                                                            {r.altitude && <p className="text-[10px] text-slate-500">✈️ {r.altitude}m altitude</p>}
                                                            {r.recommendation && <p className="text-[10px] text-slate-600 italic mt-1">{r.recommendation}</p>}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="glass-card overflow-hidden min-h-[300px]">
                        <div className="p-6 border-b border-slate-100">
                            <h2 className="text-xl font-bold text-slate-900">AI Intelligence</h2>
                        </div>
                        <div className="p-6">
                            {isScanning ? (
                                <DroneSimulator onComplete={handleScanComplete} cropType={cropType} />
                            ) : prediction ? (
                                <PredictionResult result={prediction} />
                            ) : (
                                <div className="flex flex-col items-center justify-center text-center py-12 gap-4">
                                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                                        <Sprout size={32} />
                                    </div>
                                    <div>
                                        <p className="text-slate-900 font-bold">No Analysis Yet</p>
                                        <p className="text-xs text-slate-500 max-w-[200px] mt-1 mx-auto">Complete a drone scan or upload an image to see AI results.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* FARM NAMING MODAL */}
            {showNameModal && (
                <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-[32px] p-8 w-full max-w-md shadow-2xl animate-scale-up border border-slate-100">
                        <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center text-green-600 mb-6">
                            <MapIcon size={32} />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 mb-2">Name Your Land</h3>
                        <p className="text-slate-500 text-sm mb-6">Provide a recognizable name for this farm area to store it in your records.</p>

                        <div className="space-y-4 mb-8">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Farm Name</label>
                            <input
                                type="text"
                                value={farmName}
                                onChange={(e) => setFarmName(e.target.value)}
                                placeholder="e.g. North Guava Field"
                                className="w-full px-5 py-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-green-500/20 focus:bg-white transition-all outline-none font-medium text-slate-900 placeholder:text-slate-300"
                                autoFocus
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowNameModal(false)}
                                className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-2xl transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    setShowNameModal(false);
                                    handleAddField();
                                }}
                                disabled={!farmName.trim()}
                                className="flex-[2] py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-green-100 disabled:opacity-50 disabled:shadow-none"
                            >
                                Save Land Data
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* SENSOR FORM MODAL */}
            {sensorFormFarmId && (
                <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-[32px] p-8 w-full max-w-md shadow-2xl animate-scale-up border border-slate-100 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-violet-100 rounded-2xl flex items-center justify-center text-violet-600">
                                    <Cpu size={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">{editingSensorId ? 'Edit Sensor' : 'Add Sensor'}</h3>
                                    <p className="text-xs text-slate-400">{savedFarms.find(f => f.id === sensorFormFarmId)?.farm_name || 'Field'}</p>
                                </div>
                            </div>
                            <button onClick={resetSensorForm} className="text-slate-400 hover:text-red-500 transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-6 mb-8">
                            {/* ── Section: Sensor Information ── */}
                            <div>
                                <p className="text-[11px] font-extrabold text-violet-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <span className="w-5 h-[2px] bg-violet-200 rounded-full" />Sensor Information
                                </p>
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1 mb-1 block">Sensor Name *</label>
                                        <input type="text" value={sensorFormData.sensorName} onChange={e => setSensorFormData(p => ({ ...p, sensorName: e.target.value }))}
                                            placeholder="e.g. Field Sensor 1" className="w-full px-4 py-3 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-violet-500/20 focus:bg-white transition-all outline-none font-medium text-sm text-slate-900 placeholder:text-slate-300" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1 mb-1 block">Sensor Node ID</label>
                                        <input type="text" value={sensorFormData.sensorNodeId} onChange={e => setSensorFormData(p => ({ ...p, sensorNodeId: e.target.value }))}
                                            placeholder="e.g. sensor_001" className="w-full px-4 py-3 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-violet-500/20 focus:bg-white transition-all outline-none font-medium text-sm text-slate-900 placeholder:text-slate-300" />
                                        <p className="text-[10px] text-slate-400 mt-1 pl-1">The ID used by the sensor hardware</p>
                                    </div>
                                </div>
                            </div>

                            {/* ── Section: Installation Details ── */}
                            <div>
                                <p className="text-[11px] font-extrabold text-violet-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <span className="w-5 h-[2px] bg-violet-200 rounded-full" />Installation Details
                                </p>
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1 mb-1 block">
                                            Installation Date {!editingSensorId && <span className="text-violet-400 normal-case">(auto-set to today)</span>}
                                        </label>
                                        <input type="date" value={sensorFormData.installationDate || (!editingSensorId ? new Date().toISOString().split('T')[0] : '')}
                                            onChange={e => setSensorFormData(p => ({ ...p, installationDate: e.target.value }))}
                                            className="w-full px-4 py-3 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-violet-500/20 focus:bg-white transition-all outline-none font-medium text-sm text-slate-900" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1 mb-1 block">Notes</label>
                                        <textarea value={sensorFormData.notes} onChange={e => setSensorFormData(p => ({ ...p, notes: e.target.value }))}
                                            placeholder="e.g. Installed near irrigation area" rows={3}
                                            className="w-full px-4 py-3 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-violet-500/20 focus:bg-white transition-all outline-none font-medium text-sm text-slate-900 placeholder:text-slate-300 resize-none" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button onClick={resetSensorForm}
                                className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-2xl transition-all">Cancel</button>
                            <button onClick={handleSaveSensor}
                                disabled={!sensorFormData.sensorName.trim()}
                                className="flex-[2] py-4 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-violet-100 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2">
                                {editingSensorId ? <><Save size={16} /> Update Sensor</> : <><Plus size={16} /> Add Sensor</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* HOW TO USE GUIDE */}
            {showGuide && (
                <div className="fixed bottom-8 right-8 z-[2000] max-w-xs animate-slide-in">
                    <div className="bg-slate-900 text-white p-6 rounded-[32px] shadow-2xl border border-white/10 relative overflow-hidden group">
                        <div className="absolute -top-4 -right-4 w-20 h-20 bg-green-500/10 rounded-full blur-2xl group-hover:bg-green-500/20 transition-all"></div>
                        <button
                            onClick={() => setShowGuide(false)}
                            className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
                        >
                            ×
                        </button>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-green-500/20 rounded-xl text-green-400">
                                <Sparkles size={18} />
                            </div>
                            <h4 className="font-bold text-sm tracking-wide uppercase">Quick Guide</h4>
                        </div>
                        <ul className="space-y-3 text-xs text-slate-300">
                            <li className="flex gap-2">
                                <span className="text-green-400 font-bold">1.</span>
                                <span>Click the <b>Polygon Icon</b> on map top-right.</span>
                            </li>
                            <li className="flex gap-2">
                                <span className="text-green-400 font-bold">2.</span>
                                <span>Click map to mark your <b>farm corners</b>.</span>
                            </li>
                            <li className="flex gap-2">
                                <span className="text-green-400 font-bold">3.</span>
                                <span>Click <b>Save</b> to store it in the database.</span>
                            </li>
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
}
