import { Routes, Route } from 'react-router-dom';
import RootLayout from './layouts/RootLayout';
import Home from './pages/Home';
import CategoryPage from './pages/CategoryPage';
import ArticlePage from './pages/ArticlePage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<RootLayout />}>
        <Route index element={<Home />} />
        <Route path="world" element={<CategoryPage title="World" />} />
        <Route path="politics" element={<CategoryPage title="Politics" />} />
        <Route path="business" element={<CategoryPage title="Business" />} />
        <Route path="tech" element={<CategoryPage title="Tech" />} />
        <Route path="culture" element={<CategoryPage title="Culture" />} />
        <Route path="opinion" element={<CategoryPage title="Opinion" />} />
        <Route path="video" element={<CategoryPage title="Video" />} />
        <Route path="article/:id" element={<ArticlePage />} />
        <Route path="account" element={<CategoryPage title="Account" />} />
        <Route path="subscribe" element={<CategoryPage title="Subscribe" />} />
      </Route>
    </Routes>
  );
}

export default App;
