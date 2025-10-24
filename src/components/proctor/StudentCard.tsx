import type {StudentInfo} from "../../types/room.types.ts";
import {useEffect, useRef} from "react";

interface StudentCardProps {
    student: StudentInfo;
}

export default function StudentCard({ student }: StudentCardProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    useEffect(() => {
        if (videoRef.current && student.stream) {
            videoRef.current.srcObject = student.stream;
        }
    }, [student.stream]);
    return (
        <div className="bg-white rounded-2xl p-4 border border-gray-300 shadow-md transition-transform duration-300 hover:-translate-y-1">
            <div className="w-full aspect-video bg-gray-950 rounded-xl overflow-hidden">
                {student.stream ? (
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                    />
                ) : (
                    <div className="w-full h-full bg-gray-950 text-gray-600 flex items-center justify-center text-xl">
                        {student.name}
                    </div>
                )}
            </div>
            <div className="py-3 px-2 pb-2 flex justify-between items-center">
                <span className="text-gray-800 font-medium">{student.name}</span>
                <div className="flex gap-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                        student.hasAudio ? 'bg-success' : 'bg-danger opacity-50'
                    }`}>
                        🎤
                    </div>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                        student.hasVideo ? 'bg-success' : 'bg-danger opacity-50'
                    }`}>
                        📹
                    </div>
                </div>
            </div>
        </div>
    );
}
