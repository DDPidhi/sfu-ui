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
        <div className="min-h-screen flex flex-col">
            {/* Header */}
            <header className="bg-gray-100 border-b border-gray-300 p-4 px-8 flex justify-between items-center">
                <h1 className="text-gray-800 text-2xl font-semibold">Proctor Dashboard</h1>
                <div>
                    <button className="py-2 px-6 rounded-lg border-0 text-sm font-medium cursor-pointer transition-all duration-300 bg-primary text-white hover:-translate-y-0.5 hover:shadow-xl">
                        Start Room
                    </button>
                </div>
            </header>

            {/* Join Requests */}
            <div className="fixed top-[100px] right-8 w-80 z-[150]">
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
            <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6 p-8 flex-1">
                {mockStudents.map(student => (
                    <StudentCard key={student.id} student={student} />
                ))}
            </div>

            {/* Proctor Video Circle */}
            <div className="fixed bottom-[100px] right-8 w-[180px] h-[180px] rounded-full overflow-hidden border-4 border-white shadow-2xl z-[100]">
                <div className="w-full h-full bg-gray-950 text-gray-600 flex items-center justify-center text-xl">
                    Your Video
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-md p-4 px-8 flex justify-between items-center border-t border-white/10 z-[200]">
                <div className="flex gap-8 text-white">
                    <div className="flex items-center gap-2">
                        <span className="opacity-70 text-sm">Room ID:</span>
                        <span className="font-semibold">{roomId}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="opacity-70 text-sm">Students:</span>
                        <span className="font-semibold">{mockStudents.length}</span>
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
