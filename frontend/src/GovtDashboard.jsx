import React, { useState, useEffect } from 'react';
import { getFactories, getAlerts } from './api';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const redIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
});

const greenIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
});

const yellowIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
});

function GovtDashboard() {
    const [factories, setFactories] = useState([]);
    const [alerts, setAlerts] = useState([]);

    const fetchData = async () => {
        try {
            const fData = await getFactories();
            setFactories(fData);
            const aData = await getAlerts(20);
            setAlerts(aData);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 10000);
        return () => clearInterval(interval);
    }, []);

    const activeAlerts = alerts.filter(a => !a.is_resolved);
    const inactiveCount = factories.filter(f => !f.is_active).length;

    return (
        <div>
            <div className="dashboard-header">
                <h1 className="dashboard-title">Government Safety Overview</h1>
            </div>

            <div className="grid grid-cols-4" style={{ marginBottom: '2rem' }}>
                <div className="card stat-card">
                    <div className="stat-icon icon-factory">🏢</div>
                    <div className="stat-info">
                        <div className="stat-label">Total Factories</div>
                        <div className="stat-value">{factories.length}</div>
                    </div>
                </div>
                <div className="card stat-card">
                    <div className="stat-icon icon-gas">🟢</div>
                    <div className="stat-info">
                        <div className="stat-label">Active Monitored</div>
                        <div className="stat-value">{factories.filter(f => f.is_active).length}</div>
                    </div>
                </div>
                <div className="card stat-card">
                    <div className="stat-icon icon-alert">🔴</div>
                    <div className="stat-info">
                        <div className="stat-label">Inactive/Offline</div>
                        <div className="stat-value">{inactiveCount}</div>
                    </div>
                </div>
                <div className="card stat-card">
                    <div className="stat-icon icon-alert">⚠️</div>
                    <div className="stat-info">
                        <div className="stat-label">Global Active Alerts</div>
                        <div className="stat-value">{activeAlerts.length}</div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2">
                <div className="card">
                    <h2 className="card-title">Google Maps Regional View</h2>
                    {factories.length > 0 && (
                        <MapContainer center={[9.4533, 77.8024]} zoom={12} scrollWheelZoom={false}>
                            {/* Using Google Maps Standard Tile Layer */}
                            <TileLayer
                                attribution='&copy; Google Maps'
                                url="http://mt0.google.com/vt/lyrs=m&hl=en&x={x}&y={y}&z={z}"
                            />
                            {factories.map(factory => {
                                const factoryAlerts = activeAlerts.filter(a => a.factory_id === factory.id);
                                const score = factory.score || 100;

                                let icon = greenIcon;
                                let colorClass = '#10b981';
                                if (score < 50 || !factory.is_active) {
                                    icon = redIcon;
                                    colorClass = '#ef4444';
                                } else if (score < 80) {
                                    icon = yellowIcon;
                                    colorClass = '#f59e0b';
                                }

                                return (
                                    <Marker
                                        key={factory.id}
                                        position={[factory.location_lat, factory.location_lng]}
                                        icon={icon}
                                    >
                                        <Popup>
                                            <div style={{ color: '#000', minWidth: '150px' }}>
                                                <h3 style={{ margin: '0 0 5px 0', borderBottom: '1px solid #ccc', paddingBottom: '5px' }}>{factory.name}</h3>
                                                <div style={{ margin: '5px 0' }}>
                                                    <strong>Status:</strong> {factory.is_active ? 'Active' : 'Offline'}
                                                </div>
                                                <div style={{ margin: '5px 0' }}>
                                                    <strong>Safety Score:</strong> <span style={{ color: colorClass, fontWeight: 'bold' }}>{score.toFixed(1)} / 100</span>
                                                </div>
                                                <div style={{ margin: '5px 0' }}>
                                                    <strong>Active Alerts:</strong> {factoryAlerts.length}
                                                </div>
                                                <div style={{ marginTop: '10px', fontSize: '0.8rem', color: '#666' }}>
                                                    Last seen: {new Date(factory.last_seen + 'Z').toLocaleString()}
                                                </div>
                                            </div>
                                        </Popup>
                                    </Marker>
                                );
                            })}
                        </MapContainer>
                    )}
                </div>

                <div className="card">
                    <h2 className="card-title">Global Alert Feed</h2>
                    <div className="alert-list" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        {alerts.length === 0 ? <p style={{ color: '#94a3b8' }}>No recent alerts</p> : null}
                        {alerts.map(alert => {
                            const factory = factories.find(f => f.id === alert.factory_id);
                            return (
                                <div key={alert.id} className={`alert-item ${alert.is_resolved ? 'resolved' : ''}`}>
                                    <div>
                                        <span className={`badge ${alert.is_resolved ? 'badge-success' : 'badge-danger'}`} style={{ marginRight: '0.5rem' }}>
                                            {factory ? factory.name : `Factory ${alert.factory_id}`}
                                        </span>
                                        <strong>{alert.alert_type}</strong>: {alert.message}
                                        <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                                            {new Date(alert.timestamp + 'Z').toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default GovtDashboard;
