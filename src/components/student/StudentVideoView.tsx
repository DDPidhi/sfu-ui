import { useState } from 'react';
import MediaControls from '../shared/MediaControls';

interface StudentVideoViewProps {
    studentInfo: {
        name: string;
        roomId: string;
    };
}

export default function StudentVideoView({ studentInfo }: StudentVideoViewProps) {
    const [isVideoOn, setIsVideoOn] = useState(true);
    const [isAudioOn, setIsAudioOn] = useState(true);

    const handleLeave = () => {
        if (confirm('Are you sure you want to leave?')) {
            window.location.reload();
        }
    };

    return (
        <div className="video-interface">
            {/* Header */}
            <div className="header">
                <h1>Class Session</h1>
                <div className="header-info">
                    {studentInfo.name} • Room: {studentInfo.roomId}
                </div>
                <button className="leave-btn" onClick={handleLeave}>
                    Leave
                </button>
            </div>

            {/* Video Container */}
            <div className="video-container">
                {/* Proctor Side */}
                <div className="proctor-side">
                    <div className="video-placeholder">Proctor Video</div>
                    <div className="proctor-info">👨‍🏫 Proctor</div>
                </div>

                {/* Student Side */}
                <div className="student-side">
                    <div className="video-placeholder">Your Video</div>
                    <div className="student-info">{studentInfo.name}</div>
                </div>
            </div>

            {/* Bottom Controls */}
            <div className="bottom-controls">
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
