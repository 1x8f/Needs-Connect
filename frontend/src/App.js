import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import NeedsList from './pages/NeedsList';
import Basket from './pages/Basket';

function App() {
  return (
    <Router>
      <div>
        <Navigation />
        <Routes>
          <Route path="/" element={<NeedsList />} />
          <Route path="/basket" element={<Basket />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
