import { useState } from 'react';
import StudentJoinForm from '../components/student/StudentJoinForm';
import StudentVideoView from '../components/student/StudentVideoView';

export default function StudentPage() {
    const [isJoined, setIsJoined] = useState(false);
    const [studentInfo, setStudentInfo] = useState({
        name: '',
        roomId: '',
        peerId: ''
    });

    const handleJoin = (name: string, roomId: string, peerId: string) => {
        setStudentInfo({ name, roomId, peerId });
        setIsJoined(true);
    };

    return (
        <>
            {!isJoined ? (
                <StudentJoinForm onJoin={handleJoin} />
            ) : (
                <StudentVideoView studentInfo={studentInfo} />
            )}
        </>
    );
}
