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
        <div className="flex flex-col h-screen">
            {/* Header */}
            <div className="bg-gray-100 border-b border-gray-300 p-4 px-8 flex justify-between items-center">
                <h1 className="text-gray-800 text-2xl font-semibold">Class Session</h1>
                <div className="text-gray-600 text-sm">
                    {studentInfo.name} • Room: {studentInfo.roomId}
                </div>
                <button
                    className="py-2 px-6 bg-danger text-white border-0 rounded-lg cursor-pointer hover:bg-red-600"
                    onClick={handleLeave}
                >
                    Leave
                </button>
            </div>

            {/* Video Container */}
            <div className="flex-1 flex">
                {/* Proctor Side */}
                <div className="w-1/2 bg-gray-950 relative flex items-center justify-center">
                    <div className="w-full h-full bg-gray-950 text-gray-600 flex items-center justify-center text-xl">
                        Proctor Video
                    </div>
                    <div className="absolute bottom-5 left-5 bg-black/70 text-white py-2 px-4 rounded-lg text-sm">
                        👨‍🏫 Proctor
                    </div>
                </div>

                {/* Student Side */}
                <div className="w-1/2 bg-gray-950 relative flex items-center justify-center">
                    <div className="w-full h-full bg-gray-950 text-gray-600 flex items-center justify-center text-xl">
                        Your Video
                    </div>
                    <div className="absolute bottom-5 right-5 bg-black/70 text-white py-2 px-4 rounded-lg text-sm">
                        {studentInfo.name}
                    </div>
                </div>
            </div>

            {/* Bottom Controls */}
            <div className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-md p-4 px-8 flex justify-center z-[200]">
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
