import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProctorPage from './pages/ProctorPage';
import StudentPage from './pages/StudentPage';
import { ErrorBoundary } from './components/ErrorBoundary';

function App() {
    return (
        <ErrorBoundary>
            <BrowserRouter>
                <Routes>
                    <Route path="/proctor" element={<ProctorPage />} />
                    <Route path="/student" element={<StudentPage />} />
                    <Route path="/" element={<Navigate to="/student" replace />} />
                </Routes>
            </BrowserRouter>
        </ErrorBoundary>
    );
}

export default App;
