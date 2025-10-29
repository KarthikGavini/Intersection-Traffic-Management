// // src/App.jsx (Updated)

// import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// import IntersectionView from './components/IntersectionView';
// import CityMapView from './components/CityMapView';
// import MainLayout from './components/MainLayout'; // <-- 1. Import layout

// function App() {
//   return (
//     // We remove the <main> tag from here.
//     // The Router is the top-level component.
//     <Router>
//       <Routes>
//         {/* 2. All our pages are now children of MainLayout */}
//         <Route element={<MainLayout />}>
//           <Route path="/" element={<CityMapView />} />
//           <Route path="/intersection/:id" element={<IntersectionView />} />
//         </Route>
//       </Routes>
//     </Router>
//   );
// }

// export default App;

// src/App.jsx

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import IntersectionView from './components/IntersectionView';
import CityMapView from './components/CityMapView';
import MainLayout from './components/MainLayout';
import ViolationsLog from './components/ViolationsLog'; // <-- 1. Import the new component

function App() {
  return (
    <Router>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<CityMapView />} />
          <Route path="/intersection/:id" element={<IntersectionView />} />
          
          {/* 2. ADD THIS NEW ROUTE */}
          <Route path="/violations" element={<ViolationsLog />} />

        </Route>
      </Routes>
    </Router>
  );
}

export default App;