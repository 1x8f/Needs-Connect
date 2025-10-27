import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import NeedsList from './pages/NeedsList';
import Basket from './pages/Basket';
import ManagerDashboard from './pages/ManagerDashboard';
import AddNeed from './pages/AddNeed';
import EditNeed from './pages/EditNeed';

function App() {
  return (
    <Router>
      <div>
        <Navigation />
        <Routes>
          <Route path="/" element={<NeedsList />} />
          <Route path="/basket" element={<Basket />} />
          <Route path="/manager" element={<ManagerDashboard />} />
          <Route path="/manager/add-need" element={<AddNeed />} />
          <Route path="/manager/edit-need/:needId" element={<EditNeed />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
