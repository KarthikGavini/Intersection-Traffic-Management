// // src/App.jsx
// import IntersectionView from './components/IntersectionView';

// function App() {
//   // Apply the background and height classes to this main container
//   return (
//     <main className="bg-gray-900 min-h-screen">
//       <IntersectionView />
//     </main>
//   );
// }

// export default App;

// // src/App.jsx

// import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// import IntersectionView from './components/IntersectionView';
// import CityMapView from './components/CityMapView'; // Import the new map view

// function App() {
//   return (
//     // The main 'bg-gray-900' is still useful for the intersection view
//     <main className="bg-gray-900 min-h-screen text-white">
//       <Router>
//         <Routes>
//           {/* Route 1: The homepage is now the City Map */}
//           <Route path="/" element={<CityMapView />} />
          
//           {/* Route 2: The intersection view, now at a dynamic path */}
//           <Route path="/intersection/:id" element={<IntersectionView />} />
//         </Routes>
//       </Router>
//     </main>
//   );
// }

// export default App;

// src/App.jsx (Updated)

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import IntersectionView from './components/IntersectionView';
import CityMapView from './components/CityMapView';
import MainLayout from './components/MainLayout'; // <-- 1. Import layout

function App() {
  return (
    // We remove the <main> tag from here.
    // The Router is the top-level component.
    <Router>
      <Routes>
        {/* 2. All our pages are now children of MainLayout */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<CityMapView />} />
          <Route path="/intersection/:id" element={<IntersectionView />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;