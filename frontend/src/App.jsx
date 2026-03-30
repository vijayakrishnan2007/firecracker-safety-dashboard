import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Login from './Login';
import GovtDashboard from './GovtDashboard';
import OwnerDashboard from './OwnerDashboard';
import { logout } from './api';

function PrivateRoute({ children, role }) {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('role');
  
  if (!token) return <Navigate to="/login" />;
  if (role && role !== userRole) return <Navigate to="/" />;
  
  return (
    <div>
      <nav style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'1rem 2rem', background:'var(--card-bg)', borderBottom:'1px solid var(--border-color)', marginBottom:'2rem'}}>
         <h1 style={{margin:0, color:'var(--primary)', fontSize:'1.25rem'}}>FireGuard AI</h1>
         <div style={{display:'flex', alignItems:'center', gap:'1rem'}}>
           <span style={{color:'#94a3b8', fontSize:'0.9rem'}}>Role: {userRole === 'govt' ? 'Government Official' : 'Factory Owner'}</span>
           <button onClick={() => { logout(); window.location.href='/login'; }} style={{background:'transparent', color:'white', border:'1px solid #334155', padding:'0.5rem 1rem', borderRadius:'4px', cursor:'pointer'}}>Logout</button>
         </div>
      </nav>
      <div style={{padding:'0 2rem'}}>
        {children}
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/govt" element={<PrivateRoute role="govt"><GovtDashboard /></PrivateRoute>} />
        <Route path="/owner" element={<PrivateRoute role="owner"><OwnerDashboardWrapper /></PrivateRoute>} />
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

function OwnerDashboardWrapper() {
  const factoryId = parseInt(localStorage.getItem('factory_id'), 10);
  return <OwnerDashboard factoryId={factoryId} />;
}

export default App;
