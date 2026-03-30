import React, { useState, useEffect } from 'react';
import { getFactory, getSensorData, getAlerts, resolveAlert } from './api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const ROOMS = ["Storage Room", "Mixing", "Package Room"];

function OwnerDashboard({ factoryId }) {
    const [factory, setFactory] = useState(null);
    const [allSensorData, setAllSensorData] = useState([]);
    const [alerts, setAlerts] = useState([]);

    const fetchData = async () => {
        try {
            const fData = await getFactory(factoryId);
            setFactory(fData);

            const sData = await getSensorData(factoryId, 60); // fetch more to get enough for each room
            setAllSensorData(sData.reverse()); // chronological order for chart

            const aData = await getAlerts(10);
            setAlerts(aData.filter(a => a.factory_id === factoryId));
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5000); // 5 sec poll
        return () => clearInterval(interval);
    }, [factoryId]);

    const handleResolve = async (id) => {
        await resolveAlert(id);
        fetchData();
    };

    if (!factory) return <div>Loading...</div>;

    return (
        <div>
            <div className="dashboard-header">
                <h1 className="dashboard-title">{factory.name}</h1>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div className={`badge ${factory.score >= 80 ? 'badge-success' : factory.score >= 50 ? 'badge-warning' : 'badge-danger'}`}>
                        Safety Score: {factory.score} / 100
                    </div>
                    <div className={`badge ${factory.is_active ? 'badge-success' : 'badge-danger'}`}>
                        {factory.is_active ? 'Active' : 'Offline'}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-4" style={{ marginBottom: '2rem' }}>
                <div className="card stat-card">
                    <div className="stat-icon icon-alert">⚠️</div>
                    <div className="stat-info">
                        <div className="stat-label">Active Alerts</div>
                        <div className="stat-value">{alerts.filter(a => !a.is_resolved).length}</div>
                    </div>
                </div>
            </div>

            {ROOMS.map(room => {
                const roomData = allSensorData.filter(d => d.room_type === room);
                const currentData = roomData.length > 0 ? roomData[roomData.length - 1] : { temperature: 0, humidity: 0, gas_level: 0, flame_detected: false };

                return (
                    <div key={room} style={{ marginBottom: '3rem' }}>
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                            {room} Monitoring
                        </h2>

                        <div className="grid grid-cols-4" style={{ marginBottom: '1.5rem' }}>
                            <div className="card stat-card">
                                <div className="stat-icon icon-temp">🌡️</div>
                                <div className="stat-info">
                                    <div className="stat-label">Temperature</div>
                                    <div className="stat-value">{currentData.temperature.toFixed(1)} °C</div>
                                </div>
                            </div>
                            <div className="card stat-card">
                                <div className="stat-icon" style={{ backgroundColor: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8' }}>💧</div>
                                <div className="stat-info">
                                    <div className="stat-label">Humidity</div>
                                    <div className="stat-value">{currentData.humidity.toFixed(1)} %</div>
                                </div>
                            </div>
                            <div className="card stat-card">
                                <div className="stat-icon icon-gas">💨</div>
                                <div className="stat-info">
                                    <div className="stat-label">Gas Level</div>
                                    <div className="stat-value">{currentData.gas_level.toFixed(1)} ppm</div>
                                </div>
                            </div>
                            <div className="card stat-card">
                                <div className="stat-icon icon-alert">🔥</div>
                                <div className="stat-info">
                                    <div className="stat-label">Flame Status</div>
                                    <div className="stat-value" style={{ color: currentData.flame_detected ? 'var(--danger)' : 'inherit' }}>
                                        {currentData.flame_detected ? 'Detected!' : 'Safe'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2">
                            <div className="card">
                                <h3 className="card-title">Temperature & Gas</h3>
                                <div className="chart-container">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={roomData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                            <XAxis dataKey="timestamp" tickFormatter={(t) => new Date(t + 'Z').toLocaleTimeString()} stroke="#94a3b8" />
                                            <YAxis yAxisId="left" stroke="#f59e0b" />
                                            <YAxis yAxisId="right" orientation="right" stroke="#10b981" />
                                            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', color: '#fff' }} />
                                            <Legend />
                                            <Line yAxisId="left" type="monotone" dataKey="temperature" stroke="#f59e0b" strokeWidth={2} name="Temp (°C)" dot={false} />
                                            <Line yAxisId="right" type="monotone" dataKey="gas_level" stroke="#10b981" strokeWidth={2} name="Gas (ppm)" dot={false} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="card">
                                <h3 className="card-title">Humidity</h3>
                                <div className="chart-container">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={roomData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                            <XAxis dataKey="timestamp" tickFormatter={(t) => new Date(t + 'Z').toLocaleTimeString()} stroke="#94a3b8" />
                                            <YAxis stroke="#38bdf8" />
                                            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', color: '#fff' }} />
                                            <Legend />
                                            <Line type="monotone" dataKey="humidity" stroke="#38bdf8" strokeWidth={2} name="Humidity (%)" dot={false} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            })}

            <div className="card" style={{ marginTop: '2rem' }}>
                <h2 className="card-title">Recent Alerts</h2>
                <div className="alert-list">
                    {alerts.length === 0 ? <p style={{ color: '#94a3b8' }}>No alerts</p> : null}
                    {alerts.map(alert => (
                        <div key={alert.id} className={`alert-item ${alert.is_resolved ? 'resolved' : ''}`}>
                            <div>
                                <strong>{alert.alert_type}</strong>: {alert.message}
                                <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                                    {new Date(alert.timestamp + 'Z').toLocaleString()}
                                </div>
                            </div>
                            {!alert.is_resolved && (
                                <button className="badge badge-success" onClick={() => handleResolve(alert.id)} style={{ cursor: 'pointer', border: 'none' }}>
                                    Resolve
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default OwnerDashboard;
