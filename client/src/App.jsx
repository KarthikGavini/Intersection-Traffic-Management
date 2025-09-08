// src/App.jsx
import IntersectionView from './components/IntersectionView';

function App() {
  // Apply the background and height classes to this main container
  return (
    <main className="bg-gray-900 min-h-screen">
      <IntersectionView />
    </main>
  );
}

export default App;