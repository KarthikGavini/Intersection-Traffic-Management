// src/components/MainLayout.jsx

import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';

const MainLayout = () => {
  return (
    // This div ensures the dark background for all pages
    <div className="bg-gray-900 text-white flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        {/* All child routes (Map, Intersection) will render here */}
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;