import { useState } from 'react';
import StudentJoinForm from '../components/student/StudentJoinForm';
import StudentVideoView from '../components/student/StudentVideoView';
import StudentDashboard from '../components/student/StudentDashboard';
import WalletConnect from '../components/shared/WalletConnect';
import { useWallet } from '../hooks/useWallet';

type PageView = 'dashboard' | 'join' | 'exam';

export default function StudentPage() {
    const [view, setView] = useState<PageView>('dashboard');
    const [studentInfo, setStudentInfo] = useState({
        name: '',
        roomId: '',
        peerId: '',
        walletAddress: ''
    });

    const {
        address,
        isConnecting,
        isConnected,
        error,
        connect,
        formatAddress,
    } = useWallet();

    const handleJoin = (name: string, roomId: string, peerId: string) => {
        setStudentInfo({ name, roomId, peerId, walletAddress: address || '' });
        setView('exam');
    };

    const handleJoinRoom = () => {
        setView('join');
    };

    const handleBackToDashboard = () => {
        setView('dashboard');
    };

    // Not connected - show wallet connect screen
    if (!isConnected) {
        return (
            <div className="flex justify-center items-center min-h-screen p-8 bg-gradient-to-br from-primary to-primary-dark">
                <div className="bg-white/95 backdrop-blur-md rounded-2xl p-12 w-full max-w-md shadow-2xl text-center">
                    <div className="text-6xl mb-6">🎓</div>
                    <h1 className="text-gray-800 text-3xl font-bold mb-4">Welcome, Student</h1>
                    <p className="text-gray-600 mb-8">
                        Connect your wallet to view your exam history and join proctored sessions.
                    </p>
                    <WalletConnect
                        address={address}
                        isConnecting={isConnecting}
                        isConnected={isConnected}
                        error={error}
                        onConnect={connect}
                        formatAddress={formatAddress}
                    />
                </div>
            </div>
        );
    }

    // Connected - show appropriate view
    switch (view) {
        case 'join':
            return (
                <div className="relative">
                    <button
                        onClick={handleBackToDashboard}
                        className="absolute top-4 left-4 z-50 px-4 py-2 bg-white/90 text-gray-700 rounded-lg font-medium hover:bg-white transition-colors shadow-md"
                    >
                        ← Back to Dashboard
                    </button>
                    <StudentJoinForm onJoin={handleJoin} />
                </div>
            );

        case 'exam':
            return <StudentVideoView studentInfo={studentInfo} />;

        case 'dashboard':
        default:
            return <StudentDashboard onJoinRoom={handleJoinRoom} />;
    }
}
