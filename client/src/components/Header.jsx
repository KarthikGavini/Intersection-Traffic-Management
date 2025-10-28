// src/components/Header.jsx

import React from 'react';
import { Link } from 'react-router-dom';

const Header = () => {
  return (
    <header className="bg-gray-800 text-white shadow-lg p-4 flex justify-between items-center" style={{ height: '68px' }}>
      <h1 className="text-2xl font-bold text-cyan-400">
        <Link to="/">Smart City Traffic Manager</Link>
      </h1>
      <nav>
        <Link to="/" className="text-lg hover:text-cyan-300 transition">
          City Map
        </Link>
      </nav>
    </header>
  );
};

export default Header;