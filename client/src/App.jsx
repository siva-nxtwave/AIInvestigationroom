import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { Navbar } from './components/Navbar.jsx';
import { Footer } from './components/Footer.jsx';
import { Home } from './pages/Home.jsx';
import { CreateCase } from './pages/CreateCase.jsx';
import { InvestigationRoom } from './pages/InvestigationRoom.jsx';
import { Results } from './pages/Results.jsx';
import { FileQuestion, ArrowLeft } from 'lucide-react';

function NotFound() {
  return (
    <div className="max-w-md mx-auto py-24 text-center space-y-6">
      <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 mx-auto">
        <FileQuestion className="w-8 h-8" />
      </div>
      <div>
        <span className="text-xs font-mono text-amber-400 uppercase tracking-widest">Error 404</span>
        <h2 className="font-serif font-black text-3xl text-slate-100 mt-1">Case File Not Found</h2>
        <p className="text-sm text-slate-400 mt-2">
          The investigation record you are looking for does not exist in the bureau archives.
        </p>
      </div>
      <Link
        to="/"
        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium bg-amber-500 text-noir-950 hover:bg-amber-400 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Detective Desk</span>
      </Link>
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <div className="flex flex-col min-h-screen bg-noir-950 text-slate-100 font-sans selection:bg-amber-500/30 selection:text-amber-200">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/create" element={<CreateCase />} />
            <Route path="/case/:id" element={<InvestigationRoom />} />
            <Route path="/case/:id/result" element={<Results />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;

