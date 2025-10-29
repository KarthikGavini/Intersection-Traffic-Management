// // src/components/Header.jsx

// import React from 'react';
// import { Link } from 'react-router-dom';
// import { FaRoute } from 'react-icons/fa'; // Import an icon

// const Header = ({ isVipMode, onToggleVipMode }) => { // 1. Accept new props
//   return (
//     <header className="bg-gray-800 text-white shadow-lg p-4 flex justify-between items-center" style={{ height: '68px' }}>
//       <h1 className="text-2xl font-bold text-cyan-400">
//         <Link to="/">Smart City Traffic Manager</Link>
//       </h1>
//       <nav className="flex items-center space-x-6">
//         {/* 2. Add the VIP Mode Toggle Button */}
//         <button
//           onClick={onToggleVipMode}
//           className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition ${
//             isVipMode
//               ? 'bg-cyan-500 text-white'
//               : 'bg-gray-700 hover:bg-gray-600'
//           }`}
//         >
//           <FaRoute />
//           <span>{isVipMode ? 'Planning VIP Route' : 'VIP Mode'}</span>
//         </button>

//         <Link to="/" className="text-lg hover:text-cyan-300 transition">
//           City Map
//         </Link>
//       </nav>
//     </header>
//   );
// };

// export default Header;

// src/components/Header.jsx

import React from 'react';
import { Link } from 'react-router-dom';
import { FaRoute } from 'react-icons/fa';

const Header = ({ isVipMode, onToggleVipMode }) => {
  return (
    <header className="bg-gray-800 text-white shadow-lg p-4 flex justify-between items-center" style={{ height: '68px' }}>
      <h1 className="text-2xl font-bold text-cyan-400">
        <Link to="/">Smart City Traffic Manager</Link>
      </h1>
      <nav className="flex items-center space-x-6">
        <button
          onClick={onToggleVipMode}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition ${
            isVipMode
              ? 'bg-cyan-500 text-white'
              : 'bg-gray-700 hover:bg-gray-600'
          }`}
        >
          <FaRoute />
          <span>VIP Mode</span>
        </button>

        {/* 1. ADD THIS VIOLATIONS LINK */}
        <Link to="/violations" className="text-lg hover:text-cyan-300 transition">
          Violations
        </Link>
        
        {/* 2. This link is already here */}
        <Link to="/" className="text-lg hover:text-cyan-300 transition">
          City Map
        </Link>
      </nav>
    </header>
  );
};

export default Header;