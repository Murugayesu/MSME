import React, { useRef, useEffect, memo, useCallback, useState } from 'react';
import {
    MapContainer,
    TileLayer,
    LayersControl,
    Marker,
    Popup,
    Polygon,
    LayerGroup,
    useMap,
    Tooltip,
    Polyline,
    CircleMarker,
} from 'react-leaflet';

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './leaflet.css';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// ── Fix default marker icon ───────────────────────────────────────────────────
const DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

const { BaseLayer } = LayersControl;

/** Create a numbered vertex divIcon for drawing mode */
function makeVertexIcon(n) {
    return L.divIcon({
        className: '',
        html: `<div style="
            width:30px;height:30px;
            background:#0f172a;
            border:3px solid #22c55e;
            border-radius:50%;
            display:flex;align-items:center;justify-content:center;
            font-size:12px;font-weight:900;color:#fff;
            box-shadow:0 0 16px rgba(34,197,94,0.7);
            pointer-events:none;
            transition: transform 0.15s ease;
        ">${n}</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
    });
}

/** Create a numbered vertex divIcon for EDIT mode (amber, draggable) */
function makeEditVertexIcon(n) {
    return L.divIcon({
        className: '',
        html: `<div style="
            width:32px;height:32px;
            background:#f59e0b;
            border:3px solid #fff;
            border-radius:50%;
            display:flex;align-items:center;justify-content:center;
            font-size:12px;font-weight:900;color:#0f172a;
            box-shadow:0 0 18px rgba(245,158,11,0.7);
            cursor:grab;
            transition: transform 0.15s ease;
        ">${n}</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
    });
}

// ── FlyTo helper ──────────────────────────────────────────────────────────────
function FlyToArea({ target }) {
    const map = useMap();
    useEffect(() => {
        if (!target || !target.length) return;
        try {
            const pts = target.map(pt => [pt.lat ?? pt[0], pt.lng ?? pt[1]]);
            const bounds = L.latLngBounds(pts);
            if (bounds.isValid()) {
                map.flyToBounds(bounds, { padding: [60, 60], maxZoom: 19, duration: 1.5 });
            }
        } catch (e) {
            console.warn('FlyToArea:', e);
        }
    }, [target, map]);
    return null;
}

// ── MapReady bridge ───────────────────────────────────────────────────────────
function MapReadyHandler({ onReady }) {
    const map = useMap();
    useEffect(() => {
        if (map && onReady) onReady(map);
    }, [map, onReady]);
    return null;
}

// ══════════════════════════════════════════════════════════════════════════════
//  MAIN COMPONENT — Custom click-to-draw polygon system
// ══════════════════════════════════════════════════════════════════════════════
export default memo(function MapSelector({
    onAreaSelect,
    onVertexAdd,
    onDeletedFarm,
    onAreaEdited,
    onEditFarm,
    onAddSensor,
    sensorReadings = {},
    savedFarms = [],
    areas = [],
    isDrawing = false,
    flyToCoords = null,
    highlightAreaId = null,
}) {
    const mapRef = useRef(null);

    // ── Custom drawing state ──────────────────────────────────────────────────
    const [drawVertices, setDrawVertices] = useState([]);

    // ── Map ready ─────────────────────────────────────────────────────────────
    const handleMapReady = useCallback((map) => {
        mapRef.current = map;
        setTimeout(() => map.invalidateSize(), 150);
    }, []);

    // ── Cursor style ──────────────────────────────────────────────────────────
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;
        const container = map.getContainer();
        container.style.cursor = isDrawing ? 'crosshair' : '';
    }, [isDrawing]);

    // ── Map click handler — the core of custom drawing ────────────────────────
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        const onClick = (e) => {
            if (!isDrawing) return;

            const clickedLatLng = { lat: e.latlng.lat, lng: e.latlng.lng };

            setDrawVertices(prev => {
                // Check if the user clicked near the FIRST point to close the polygon
                if (prev.length >= 3) {
                    const first = prev[0];
                    const distPx = map.latLngToContainerPoint(e.latlng)
                        .distanceTo(map.latLngToContainerPoint(L.latLng(first.lat, first.lng)));
                    if (distPx < 20) {
                        const finalCoords = prev.map(p => ({ lat: p.lat, lng: p.lng }));
                        if (onAreaSelect) onAreaSelect(finalCoords);
                        if (onVertexAdd) onVertexAdd(0);
                        return [];
                    }
                }

                const newVerts = [...prev, clickedLatLng];
                if (onVertexAdd) onVertexAdd(newVerts.length);
                return newVerts;
            });
        };

        map.on('click', onClick);
        return () => map.off('click', onClick);
    }, [isDrawing, onAreaSelect, onVertexAdd]);

    // ── Clear draw vertices when drawing mode is turned off externally ─────────
    useEffect(() => {
        if (!isDrawing) {
            setDrawVertices([]);
        }
    }, [isDrawing]);

    // ───────────────────────────────────────────────────────────────────────────
    return (
        <MapContainer
            center={[11.1271, 78.6569]}
            zoom={16}
            scrollWheelZoom={true}
            style={{ height: '100%', width: '100%', zIndex: 0 }}
        >
            <MapReadyHandler onReady={handleMapReady} />
            {flyToCoords && <FlyToArea target={flyToCoords} />}

            {/* Base layers */}
            <LayersControl position="bottomleft">
                <BaseLayer checked name="Satellite Hybrid">
                    <TileLayer
                        url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
                        attribution="&copy; Google Maps"
                    />
                </BaseLayer>
                <BaseLayer name="Street Map">
                    <TileLayer
                        attribution="&copy; OpenStreetMap contributors"
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                </BaseLayer>
            </LayersControl>

            {/* ── LIVE DRAWING: Numbered vertex markers ──────────────────────── */}
            {drawVertices.map((v, idx) => (
                <Marker
                    key={`draw-vertex-${idx}`}
                    position={[v.lat, v.lng]}
                    icon={makeVertexIcon(idx + 1)}
                    interactive={false}
                />
            ))}

            {/* ── LIVE DRAWING: Polyline connecting placed points ────────────── */}
            {drawVertices.length >= 2 && (
                <Polyline
                    positions={drawVertices.map(v => [v.lat, v.lng])}
                    pathOptions={{ color: '#22c55e', weight: 3, dashArray: '8 6', opacity: 0.8 }}
                />
            )}

            {/* ── LIVE DRAWING: Dashed line from last point back to first ─────── */}
            {drawVertices.length >= 3 && (
                <Polyline
                    positions={[
                        [drawVertices[drawVertices.length - 1].lat, drawVertices[drawVertices.length - 1].lng],
                        [drawVertices[0].lat, drawVertices[0].lng],
                    ]}
                    pathOptions={{ color: '#f59e0b', weight: 2, dashArray: '4 6', opacity: 0.6 }}
                />
            )}

            {/* ── LIVE DRAWING: "Close here" indicator on first point ──────── */}
            {drawVertices.length >= 3 && (
                <CircleMarker
                    center={[drawVertices[0].lat, drawVertices[0].lng]}
                    radius={12}
                    pathOptions={{
                        color: '#22c55e',
                        fillColor: '#22c55e',
                        fillOpacity: 0.3,
                        weight: 2,
                    }}
                >
                    <Tooltip permanent direction="top" offset={[0, -15]}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#15803d' }}>
                            Click to close
                        </span>
                    </Tooltip>
                </CircleMarker>
            )}

            {/* ── Saved area polygons ─────────────────────────────────────── */}
            <LayerGroup>
                {areas.map(area => {
                    if (!area.coordinates || area.coordinates.length < 3) return null;
                    const isHighlighted = highlightAreaId && area.id === highlightAreaId;
                    return (
                        <Polygon
                            key={area.id ?? Math.random()}
                            positions={area.coordinates}
                            pathOptions={
                                isHighlighted
                                    ? { color: '#f59e0b', fillColor: '#fbbf24', fillOpacity: 0.4, weight: 5, dashArray: '8 4' }
                                    : { color: '#10b981', fillColor: '#10b981', fillOpacity: 0.2, weight: 3 }
                            }
                        >
                            <Tooltip sticky>
                                <span style={{ fontWeight: 700, fontSize: 11 }}>
                                    {area.farm_name || 'Farm Area'}
                                </span>
                                <br />
                                <span style={{ fontSize: 10, color: '#64748b' }}>
                                    {area.coordinates.length} boundary points
                                    {(area.sensors || []).length > 0 && ` · ${area.sensors.length} sensor${area.sensors.length !== 1 ? 's' : ''}`}
                                </span>
                                {isHighlighted && (
                                    <>
                                        <br />
                                        <span style={{ fontSize: 10, color: '#d97706', fontWeight: 700 }}>
                                            📍 Selected
                                        </span>
                                    </>
                                )}
                            </Tooltip>
                            <Popup autoPan={false} closeButton={true} maxWidth={320} minWidth={260}>
                                <div style={{ fontFamily: 'Inter, system-ui, sans-serif', padding: 2 }}>
                                    {/* Field Name */}
                                    <p style={{ fontWeight: 800, fontSize: 13, color: '#0f172a', margin: '0 0 2px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        {area.farm_name || 'Farm Area'}
                                    </p>
                                    <p style={{ fontSize: 10, color: '#94a3b8', margin: '0 0 10px 0' }}>
                                        {area.coordinates.length} boundary points
                                    </p>

                                    {/* Sensor Info */}
                                    <div style={{ background: '#f8fafc', borderRadius: 10, padding: '8px 10px', marginBottom: 10, border: '1px solid #e2e8f0' }}>
                                        <p style={{ fontSize: 10, fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px 0' }}>
                                            Sensor Information
                                        </p>
                                        {(area.sensors || []).length === 0 ? (
                                            <p style={{ fontSize: 11, color: '#94a3b8', fontStyle: 'italic', margin: 0 }}>No sensors configured for this field.</p>
                                        ) : (
                                            (area.sensors || []).map((s, si) => (
                                                <div key={s.id || si} style={{ marginBottom: si < area.sensors.length - 1 ? 8 : 0, paddingBottom: si < area.sensors.length - 1 ? 8 : 0, borderBottom: si < area.sensors.length - 1 ? '1px solid #e2e8f0' : 'none' }}>
                                                    <p style={{ fontSize: 11, fontWeight: 700, color: '#1e293b', margin: '0 0 3px 0' }}>
                                                        {s.sensorName || 'Unnamed Sensor'}
                                                    </p>
                                                    {s.firebaseNodeId && <p style={{ fontSize: 9, color: '#94a3b8', margin: '0 0 4px 0' }}>Node: {s.firebaseNodeId}</p>}
                                                    {(() => {
                                                        const r = s.firebaseNodeId ? sensorReadings[s.firebaseNodeId] : null;
                                                        if (!r) return s.firebaseNodeId ? <p style={{ fontSize: 10, color: '#94a3b8', fontStyle: 'italic', margin: '2px 0' }}>Waiting for data...</p> : null;
                                                        return (
                                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 2 }}>
                                                                {r.temperature != null && <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 99, background: '#fff7ed', color: '#c2410c' }}>🌡 {r.temperature}°C</span>}
                                                                {r.ph != null && <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 99, background: '#eff6ff', color: '#1d4ed8' }}>💧 pH {r.ph}</span>}
                                                                {r.nitrogen != null && <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 99, background: '#f0fdf4', color: '#15803d' }}>N {r.nitrogen}</span>}
                                                                {r.phosphorous != null && <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 99, background: '#fffbeb', color: '#b45309' }}>P {r.phosphorous}</span>}
                                                                {r.potassium != null && <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 99, background: '#faf5ff', color: '#7e22ce' }}>K {r.potassium}</span>}
                                                            </div>
                                                        );
                                                    })()}
                                                    {s.installationDate && <p style={{ fontSize: 10, color: '#64748b', margin: '3px 0 1px 0' }}>Installed: <strong style={{ color: '#334155' }}>{s.installationDate}</strong></p>}
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    {/* Action Buttons */}
                                    {area.id && (
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            {onEditFarm && (
                                                <button
                                                    onClick={(ev) => {
                                                        ev.stopPropagation();
                                                        const farm = savedFarms.find(f => f.id === area.id);
                                                        if (farm) onEditFarm(farm);
                                                    }}
                                                    style={{
                                                        flex: 1, padding: '6px 0', background: '#eef2ff', color: '#4f46e5',
                                                        border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 10,
                                                        cursor: 'pointer', transition: 'background 0.15s',
                                                    }}
                                                    onMouseEnter={(e) => e.target.style.background = '#e0e7ff'}
                                                    onMouseLeave={(e) => e.target.style.background = '#eef2ff'}
                                                >
                                                    ✏️ Edit
                                                </button>
                                            )}
                                            {onDeletedFarm && (
                                                <button
                                                    onClick={(ev) => { ev.stopPropagation(); onDeletedFarm(area.id); }}
                                                    style={{
                                                        flex: 1, padding: '6px 0', background: '#fef2f2', color: '#dc2626',
                                                        border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 10,
                                                        cursor: 'pointer', transition: 'background 0.15s',
                                                    }}
                                                    onMouseEnter={(e) => e.target.style.background = '#fee2e2'}
                                                    onMouseLeave={(e) => e.target.style.background = '#fef2f2'}
                                                >
                                                    🗑️ Delete
                                                </button>
                                            )}
                                            {onAddSensor && (
                                                <button
                                                    onClick={(ev) => { ev.stopPropagation(); onAddSensor(area.id); }}
                                                    style={{
                                                        flex: 1, padding: '6px 0', background: '#f5f3ff', color: '#7c3aed',
                                                        border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 10,
                                                        cursor: 'pointer', transition: 'background 0.15s',
                                                    }}
                                                    onMouseEnter={(e) => e.target.style.background = '#ede9fe'}
                                                    onMouseLeave={(e) => e.target.style.background = '#f5f3ff'}
                                                >
                                                    📡 Sensors
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </Popup>
                        </Polygon>
                    );
                })}
            </LayerGroup>

            {/* ── EDIT MODE: Draggable vertex markers ──────────────────────── */}
            {highlightAreaId && areas
                .filter(area => area.id === highlightAreaId && area.coordinates && area.coordinates.length >= 3)
                .map(area =>
                    area.coordinates.map((coord, idx) => (
                        <Marker
                            key={`edit-vertex-${area.id}-${idx}`}
                            position={[coord.lat ?? coord[0], coord.lng ?? coord[1]]}
                            icon={makeEditVertexIcon(idx + 1)}
                            draggable={true}
                            eventHandlers={{
                                dragend: (ev) => {
                                    const newLatLng = ev.target.getLatLng();
                                    const updatedCoords = area.coordinates.map((c, i) =>
                                        i === idx
                                            ? { lat: newLatLng.lat, lng: newLatLng.lng }
                                            : { lat: c.lat ?? c[0], lng: c.lng ?? c[1] }
                                    );
                                    if (onAreaEdited) onAreaEdited(area.id, updatedCoords);
                                },
                            }}
                        >
                            <Tooltip direction="top" offset={[0, -18]}>
                                <span style={{ fontSize: 10, fontWeight: 700, color: '#92400e' }}>
                                    Point {idx + 1} — Drag to move
                                </span>
                            </Tooltip>
                        </Marker>
                    ))
                )
            }
        </MapContainer>
    );
});