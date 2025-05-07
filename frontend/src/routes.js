import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Investments from './pages/Investments';
import AssetDetails from './pages/AssetDetails';
import News from './pages/News';

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/investments" element={<Investments />} />
        <Route path="/asset/:symbol" element={<AssetDetails />} />
        <Route path="/news" element={<News />} />
      </Routes>
    </BrowserRouter>
  );
}
