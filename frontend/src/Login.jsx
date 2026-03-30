import React, { useState } from 'react';
import { login } from './api';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const data = await login(username, password);
      if (data.role === 'govt') {
         navigate('/govt');
      } else {
         navigate('/owner');
      }
    } catch (err) {
      setError('Invalid credentials');
    }
  };

  return (
    <div style={{display:'flex', justifyContent:'center', alignItems:'center', height:'100vh', background:'#0f172a'}}>
       <form onSubmit={handleLogin} className="card" style={{padding:'2rem', width:'350px'}}>
         <h2 className="card-title" style={{textAlign:'center', marginBottom:'1.5rem'}}>FireGuard AI Login</h2>
         {error && <p style={{color:'var(--danger)', marginBottom:'1rem', textAlign:'center'}}>{error}</p>}
         <div style={{marginBottom:'1rem'}}>
           <label style={{display:'block', marginBottom:'0.5rem', color:'#94a3b8'}}>Username</label>
           <input type="text" value={username} onChange={e=>setUsername(e.target.value)} style={{width:'100%', padding:'0.75rem', background:'#1e293b', border:'1px solid #334155', color:'white', borderRadius:'4px'}} />
         </div>
         <div style={{marginBottom:'1.5rem'}}>
           <label style={{display:'block', marginBottom:'0.5rem', color:'#94a3b8'}}>Password</label>
           <input type="password" value={password} onChange={e=>setPassword(e.target.value)} style={{width:'100%', padding:'0.75rem', background:'#1e293b', border:'1px solid #334155', color:'white', borderRadius:'4px'}} />
         </div>
         <button type="submit" style={{width:'100%', padding:'0.75rem', background:'var(--primary)', color:'white', border:'none', borderRadius:'4px', cursor:'pointer', fontWeight:'bold'}}>Sign In</button>
       </form>
    </div>
  );
}

export default Login;
