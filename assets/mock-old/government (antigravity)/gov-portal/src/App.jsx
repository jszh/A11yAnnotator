import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import About from './pages/About';
import Services from './pages/Services';
import Benefits from './pages/Benefits';
import Taxes from './pages/Taxes';
import Licenses from './pages/Licenses';
import Contact from './pages/Contact';

// Layout with header and footer
import MainLayout from './components/MainLayout';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route path="about" element={<About />} />
          <Route path="services" element={<Services />} />
          <Route path="services/benefits" element={<Benefits />} />
          <Route path="services/taxes" element={<Taxes />} />
          <Route path="services/licenses" element={<Licenses />} />
          <Route path="contact" element={<Contact />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
