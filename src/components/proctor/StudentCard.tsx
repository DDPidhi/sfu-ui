interface StudentCardProps {
    student: {
        id: string;
        name: string;
        hasVideo: boolean;
        hasAudio: boolean;
    };
}

export default function StudentCard({ student }: StudentCardProps) {
    return (
        <div className="student-card">
            <div className="student-video">
                <div className="video-placeholder">{student.name}</div>
            </div>
            <div className="student-info">
                <span className="student-name">{student.name}</span>
                <div className="student-status">
                    <div className={`status-indicator ${student.hasAudio ? 'active' : 'inactive'}`}>
                        🎤
                    </div>
                    <div className={`status-indicator ${student.hasVideo ? 'active' : 'inactive'}`}>
                        📹
                    </div>
                </div>
            </div>
        </div>
    );
}
