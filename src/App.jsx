 import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar     from './components/Navbar';
import Dashboard  from './pages/Dashboard';
import Revenue    from './pages/Revenue';
import Salary     from './pages/Salary';
import Commission from './pages/Commission';
import Reports    from './pages/Reports';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"           element={<Dashboard />}  />
        <Route path="/revenue"    element={<Revenue />}    />
        <Route path="/salary"     element={<Salary />}     />
        <Route path="/commission" element={<Commission />} />
        <Route path="/reports"    element={<Reports />}    />
      </Routes>
      <Navbar />
    </BrowserRouter>
  );
}
