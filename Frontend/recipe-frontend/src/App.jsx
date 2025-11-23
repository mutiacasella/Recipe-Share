import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import HomePage from './pages/HomePage';
import RecipeDetail from './pages/RecipeDetail';
import './App.css';

function App() {
  return (
    <Router>
      {/* Navbar: Hanya Logo yang mengarah ke Home */}
      <nav className="navbar">
        <div className="container nav-container">
          <Link to="/" className="nav-logo">
            🍽️ RECIPE SHARE
          </Link>
          {/* Tombol dummy agar layout seimbang (opsional) */}
          <div className="nav-dummy">Let's Cook!</div>
        </div>
      </nav>
      
      <div className="container main-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/recipe/:id" element={<RecipeDetail />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;