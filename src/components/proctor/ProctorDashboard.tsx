import { useState } from 'react';
import StudentCard from './StudentCard';
import JoinRequestCard from './JoinRequestCard';
import MediaControls from "../shared/MediaControls.tsx";


export default function ProctorDashboard() {
    const [roomId] = useState('ABC123'); // Mock room ID
    const [isVideoOn, setIsVideoOn] = useState(true);
    const [isAudioOn, setIsAudioOn] = useState(true);

    // MOCK DATA - Students
    const mockStudents = [
        { id: 'student-1', name: 'John Doe', hasVideo: true, hasAudio: true },
        { id: 'student-2', name: 'Jane Smith', hasVideo: true, hasAudio: false },
        { id: 'student-3', name: 'Bob Johnson', hasVideo: false, hasAudio: true },
    ];

    // MOCK DATA - Join requests
    const mockJoinRequests = [
        { id: 'req-1', name: 'Alice Brown', peerId: 'student-4' },
    ];

    const handleApprove = (peerId: string) => {
        console.log('Approved:', peerId);
    };

    const handleDeny = (peerId: string) => {
        console.log('Denied:', peerId);
    };

    return (
        <div className="proctor-dashboard">
            {/* Header */}
            <header className="header">
                <h1>Proctor Dashboard</h1>
                <div className="header-controls">
                    <button className="btn btn-primary">Start Room</button>
                </div>
            </header>

            {/* Join Requests */}
            <div className="join-requests">
                {mockJoinRequests.map(req => (
                    <JoinRequestCard
                        key={req.id}
                        request={req}
                        onApprove={handleApprove}
                        onDeny={handleDeny}
                    />
                ))}
            </div>

            {/* Students Grid */}
            <div className="students-grid">
                {mockStudents.map(student => (
                    <StudentCard key={student.id} student={student} />
                ))}
            </div>

            {/* Proctor Video Circle */}
            <div className="proctor-video-container">
                <div className="video-placeholder">Your Video</div>
            </div>

            {/* Bottom Bar */}
            <div className="bottom-bar">
                <div className="room-info">
                    <div className="info-item">
                        <span className="info-label">Room ID:</span>
                        <span className="info-value">{roomId}</span>
                    </div>
                    <div className="info-item">
                        <span className="info-label">Students:</span>
                        <span className="info-value">{mockStudents.length}</span>
                    </div>
                </div>

                <MediaControls
                    isVideoOn={isVideoOn}
                    isAudioOn={isAudioOn}
                    onToggleVideo={() => setIsVideoOn(!isVideoOn)}
                    onToggleAudio={() => setIsAudioOn(!isAudioOn)}
                />
            </div>
        </div>
    );
}
