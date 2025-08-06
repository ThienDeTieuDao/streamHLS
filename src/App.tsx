import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { StreamView } from './components/StreamView';
import { EmbedView } from './components/EmbedView';
import { Dashboard } from './components/Dashboard';
import './index.css';

function App() {
  // Public streaming interface - no authentication required
  const publicUser = {
    id: 'public',
    username: 'Public User',
    email: 'public@streaming.local'
  };

  return (
    <Router>
      <Routes>
        <Route path="/stream/:streamId" element={<StreamView />} />
        <Route path="/embed/:streamId" element={<EmbedView />} />
        <Route path="/" element={<Dashboard user={publicUser} onLogout={() => {}} />} />
      </Routes>
    </Router>
  );
}

export default App;