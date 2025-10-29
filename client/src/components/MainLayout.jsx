// // src/components/MainLayout.jsx

// import React from 'react';
// import { Outlet } from 'react-router-dom';
// import Header from './Header';

// const MainLayout = () => {
//   return (
//     // This div ensures the dark background for all pages
//     <div className="bg-gray-900 text-white flex flex-col min-h-screen">
//       <Header />
//       <main className="flex-grow">
//         {/* All child routes (Map, Intersection) will render here */}
//         <Outlet />
//       </main>
//     </div>
//   );
// };

// export default MainLayout;

// src/components/MainLayout.jsx

import React, { useState } from 'react'; // Import useState
import { Outlet, useOutletContext } from 'react-router-dom';
import Header from './Header';

const MainLayout = () => {
  // 1. Create the VIP mode state here
  const [isVipMode, setIsVipMode] = useState(false);
  const toggleVipMode = () => setIsVipMode(prev => !prev);

  return (
    <div className="bg-gray-900 text-white flex flex-col min-h-screen">
      {/* 2. Pass the state and toggle function to the Header */}
      <Header isVipMode={isVipMode} onToggleVipMode={toggleVipMode} />
      
      <main className="flex-grow">
        {/* 3. Pass the state down to child routes (CityMapView) */}
        <Outlet context={{ isVipMode, setIsVipMode }} />
      </main>
    </div>
  );
};

// 4. Create a custom hook for child components to easily access the state
export function useVipMode() {
  return useOutletContext();
}

export default MainLayout;