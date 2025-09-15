import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProctorPage from './pages/ProctorPage';
import StudentPage from './pages/StudentPage';
import './styles/common.css';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/proctor" element={<ProctorPage />} />
                <Route path="/student" element={<StudentPage />} />
                <Route path="/" element={<Navigate to="/student" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
