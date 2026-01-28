import type {StudentInfo} from "../../types/room.types.ts";
import {useEffect, useRef, useState} from "react";

interface StudentCardProps {
    student: StudentInfo;
    onKick?: (studentId: string, reason?: string) => void;
    onWarn?: (studentId: string, message: string) => void;
    onReportSuspicious?: (studentId: string, activityType: string, details?: string) => void;
}

const SUSPICIOUS_ACTIVITY_TYPES = [
    { value: 'tab_switch', label: 'Tab Switch' },
    { value: 'window_blur', label: 'Window Blur' },
    { value: 'multiple_devices', label: 'Multiple Devices' },
    { value: 'unauthorized_person', label: 'Unauthorized Person' },
    { value: 'screen_share', label: 'Screen Share' },
    { value: 'audio_anomaly', label: 'Audio Anomaly' },
    { value: 'other', label: 'Other' },
];

export default function StudentCard({ student, onKick, onWarn, onReportSuspicious }: StudentCardProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [showActions, setShowActions] = useState(false);
    const [showKickConfirm, setShowKickConfirm] = useState(false);
    const [showReportMenu, setShowReportMenu] = useState(false);
    const [kickReason, setKickReason] = useState('');

    useEffect(() => {
        if (videoRef.current && student.stream) {
            console.log('Setting video stream for student:', student.id, student.stream);
            videoRef.current.srcObject = student.stream;

            videoRef.current.onloadedmetadata = () => {
                console.log('Video metadata loaded for:', student.name);
            };
            videoRef.current.onplay = () => {
                console.log('Video playing for:', student.name);
            };
        }
    }, [student.stream, student.id, student.name]);

    const handleKick = () => {
        if (onKick) {
            onKick(student.id, kickReason || undefined);
            setShowKickConfirm(false);
            setKickReason('');
        }
    };

    const handleWarn = () => {
        if (onWarn) {
            onWarn(student.id, 'Warning from proctor');
        }
    };

    const handleReportSuspicious = (activityType: string) => {
        if (onReportSuspicious) {
            onReportSuspicious(student.id, activityType);
            setShowReportMenu(false);
        }
    };

    return (
        <div
            className="bg-white rounded-2xl p-4 border border-gray-300 shadow-md transition-transform duration-300 hover:-translate-y-1 relative h-fit"
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => {
                setShowActions(false);
                setShowKickConfirm(false);
                setShowReportMenu(false);
            }}
        >
            <div className="w-full aspect-video bg-gray-950 rounded-xl overflow-hidden relative">
                {student.stream ? (
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full bg-gray-950 text-gray-600 flex items-center justify-center text-xl">
                        {student.name}
                    </div>
                )}

                {/* Action overlay */}
                {showActions && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-2 transition-opacity z-[250]">
                        {/* Warn Button */}
                        <button
                            onClick={handleWarn}
                            className="p-2 rounded-full bg-yellow-500 hover:bg-yellow-600 text-white transition-colors"
                            title="Warn Student"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                        </button>

                        {/* Report Suspicious Button */}
                        <button
                            onClick={() => setShowReportMenu(!showReportMenu)}
                            className="p-2 rounded-full bg-orange-500 hover:bg-orange-600 text-white transition-colors"
                            title="Report Suspicious Activity"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                            </svg>
                        </button>

                        {/* Kick Button */}
                        <button
                            onClick={() => setShowKickConfirm(!showKickConfirm)}
                            className="p-2 rounded-full bg-red-500 hover:bg-red-600 text-white transition-colors"
                            title="Kick Student"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                )}

                {/* Report Suspicious Menu */}
                {showReportMenu && (
                    <div className="absolute top-2 right-2 bg-white rounded-lg shadow-lg p-2 z-[260] min-w-[150px]">
                        <div className="text-xs font-semibold text-gray-600 mb-1 px-2">Report Activity:</div>
                        {SUSPICIOUS_ACTIVITY_TYPES.map(type => (
                            <button
                                key={type.value}
                                onClick={() => handleReportSuspicious(type.value)}
                                className="w-full text-left px-2 py-1 text-sm hover:bg-gray-100 rounded"
                            >
                                {type.label}
                            </button>
                        ))}
                    </div>
                )}

                {/* Kick Confirmation */}
                {showKickConfirm && (
                    <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-4 z-[260]">
                        <div className="text-white text-sm mb-2">Kick {student.name}?</div>
                        <input
                            type="text"
                            placeholder="Reason (optional)"
                            value={kickReason}
                            onChange={(e) => setKickReason(e.target.value)}
                            className="w-full px-2 py-1 rounded text-sm mb-2"
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={handleKick}
                                className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-sm"
                            >
                                Kick
                            </button>
                            <button
                                onClick={() => setShowKickConfirm(false)}
                                className="px-3 py-1 bg-gray-500 hover:bg-gray-600 text-white rounded text-sm"
                            >
                                Cancel
                            </button>
                        </div>
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
