import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Home from './pages/Home';
import Courses from './pages/Courses';
import CourseDetail from './pages/CourseDetail';
import Subjects from './pages/Subjects';
import Curriculum from './pages/Curriculum';
import Study from './pages/Study';
import Flashcards from './pages/Flashcards';
import Test from './pages/Test';
import Plans from './pages/Plans';
import Enterprise from './pages/Enterprise';
import Dashboard from './pages/Dashboard';
import Account from './pages/Account';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route path="courses" element={<Courses />} />
          <Route path="courses/detail" element={<CourseDetail />} />
          <Route path="subjects" element={<Subjects />} />
          <Route path="curriculum" element={<Curriculum />} />
          <Route path="study" element={<Study />} />
          <Route path="study/flashcards" element={<Flashcards />} />
          <Route path="study/test" element={<Test />} />
          <Route path="plans" element={<Plans />} />
          <Route path="enterprise" element={<Enterprise />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="account" element={<Account />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
