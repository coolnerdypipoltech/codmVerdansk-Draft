import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import OperadorPage from './pages/Operador/OperadorPage';
import SalidaPage from './pages/Salida/SalidaPage';
import './App.css';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/operador" element={<OperadorPage />} />
        <Route path="/salida" element={<SalidaPage />} />
        <Route path="*" element={<Navigate to="/operador" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
