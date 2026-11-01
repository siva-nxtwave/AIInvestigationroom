import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, PlusCircle, ShieldCheck, HelpCircle } from 'lucide-react';
import { api } from '../api/client.js';

export function Navbar() {
  const location = useLocation();
  const [serverOnline, setServerOnline] = useState(null);

  useEffect(() => {
    let mounted = true;
    api.checkHealth()
      .then(() => { if (mounted) setServerOnline(true); })
      .catch(() => { if (mounted) setServerOnline(false); });
    return () => { mounted = false; };
  }, []);

  return (
    <header className="border-b border-slate-800/80 bg-noir-900/90 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group focus:outline-none">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 group-hover:bg-amber-500/20 group-hover:border-amber-500/60 transition-colors">
            <Search className="w-5 h-5" />
          </div>
          <div>
            <div className="font-serif font-bold text-lg text-slate-100 tracking-wide flex items-center gap-2">
              <span>THE DETECTIVE'S DESK</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                AI Bureau
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono tracking-tight hidden sm:block">
              Authoritative Mystery Investigation System
            </p>
          </div>
        </Link>

        <nav className="flex items-center gap-2 sm:gap-4">
          <Link
            to="/create"
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-sm font-medium transition-all ${
              location.pathname === '/create'
                ? 'bg-amber-500 text-noir-950 shadow-md shadow-amber-500/20'
                : 'text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 border border-amber-500/30'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Case</span>
          </Link>

          {/* Service status indicator */}
          <div
            className="flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-400"
            title={serverOnline ? 'Backend API Connected' : serverOnline === false ? 'API Offline' : 'Checking API...'}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                serverOnline === true
                  ? 'bg-emerald-500 animate-pulse'
                  : serverOnline === false
                  ? 'bg-rose-500'
                  : 'bg-amber-500'
              }`}
            />
            <span className="hidden md:inline">
              {serverOnline === true ? 'SYSTEM ONLINE' : serverOnline === false ? 'OFFLINE' : 'CONNECTING'}
            </span>
          </div>
        </nav>
      </div>
    </header>
  );
}

