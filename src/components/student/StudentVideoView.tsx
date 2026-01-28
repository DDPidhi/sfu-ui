import {useCallback, useEffect, useRef, useState} from 'react';
import MediaControls from '../shared/MediaControls';
import {ConnectionStatus} from '../shared/ConnectionStatus';
import {useMediaDevices} from "../../hooks/useMediaDevices.ts";
import {extractPeerIdFromTrack, isProctorTrack} from "../../utils/trackIdentification.ts";
import {useWebRTC} from "../../hooks/useWebRTC.ts";
import type {SignalingMessage} from "../../types/signaling.types.ts";
import {useWebSocket} from "../../hooks/useWebSocket.ts";
import DummyTest from './DummyTest';

interface StudentVideoViewProps {
    studentInfo: {
        name: string;
        roomId: string;
        peerId: string;
        walletAddress: string;
    };
}

export default function StudentVideoView({ studentInfo }: StudentVideoViewProps) {
    const [proctorStream, setProctorStream] = useState<MediaStream | null>(null);
    const [isWaitingForProctor, setIsWaitingForProctor] = useState(true);
    const [testCompleted, setTestCompleted] = useState(false);
    const [testScore, setTestScore] = useState<{ score: number; total: number } | null>(null);
    const proctorVideoRef = useRef<HTMLVideoElement>(null);
    const studentVideoRef = useRef<HTMLVideoElement>(null);

    // Store send function in a ref so handleTestComplete can access it
    const sendRef = useRef<((msg: object) => void) | null>(null);

    const {
        localStream,
        isVideoEnabled,
        isAudioEnabled,
        startMedia,
        toggleVideo,
        toggleAudio
    } = useMediaDevices();


    const handleRemoteTrack = useCallback((event: RTCTrackEvent) => {
        const { track, streams } = event;

        console.log('Remote track received:', {
            kind: track.kind,
            trackId: track.id,
            streamId: streams[0]?.id
        });

        const stream = streams[0];
        if (!stream) return;

        const peerId = extractPeerIdFromTrack(track.id, stream.id);

        if (peerId && isProctorTrack(peerId)) {
            console.log('Processing proctor track:', track.kind);
            setProctorStream(prevStream => {
                let mediaStream: MediaStream;
                if (prevStream) {
                    mediaStream = prevStream;
                    console.log('Adding', track.kind, 'track to existing proctor stream');
                } else {
                    mediaStream = new MediaStream();
                    console.log('Created new MediaStream for proctor');
                }

                const existingTrackIds = mediaStream.getTracks().map(t => t.id);
                if (!existingTrackIds.includes(track.id)) {
                    mediaStream.addTrack(track);
                    console.log('Added', track.kind, 'track to proctor stream');
                } else {
                    console.log('Track already in stream, skipping');
                }

                return mediaStream;
            });
            setIsWaitingForProctor(false);
        }
    }, []);

    const { handleOffer, handleRenegotiation, addIceCandidate } = useWebRTC({
        localStream,
        onRemoteTrack: handleRemoteTrack
    });

    const handleMessage = useCallback(async (msg: SignalingMessage) => {
        console.log('Received:', msg);

        switch (msg.type) {
            case 'offer':
                { const answerSdp = await handleOffer(msg.sdp, (candidate) => {
                    send({
                        type: 'IceCandidate',
                        peer_id: studentInfo.peerId,
                        candidate: candidate.candidate,
                        sdp_mid: candidate.sdpMid || undefined,
                        sdp_mline_index: candidate.sdpMLineIndex || undefined
                    });
                });

                send({
                    type: 'Answer',
                    peer_id: studentInfo.peerId,
                    sdp: answerSdp
                });
                break; }

            case 'renegotiate':
                { const renegotiateSdp = await handleRenegotiation(msg.sdp);
                send({
                    type: 'Answer',
                    peer_id: studentInfo.peerId,
                    sdp: renegotiateSdp
                });
                break; }

            case 'IceCandidate':
                if (msg.candidate) {
                    await addIceCandidate({
                        candidate: msg.candidate,
                        sdpMid: msg.sdp_mid,
                        sdpMLineIndex: msg.sdp_mline_index
                    });
                }
                break;
        }
    }, [handleOffer, handleRenegotiation, addIceCandidate, studentInfo.peerId]);

    const { send } = useWebSocket(handleMessage);

    // Store send in ref for handleTestComplete to access
    useEffect(() => {
        sendRef.current = send;
    }, [send]);

    // Handler for when the test is completed
    const handleTestComplete = useCallback((score: number, total: number) => {
        setTestScore({ score, total });
        setTestCompleted(true);
        console.log(`Test completed: ${score}/${total}`);

        // Send exam result to server
        if (sendRef.current) {
            sendRef.current({
                type: 'SubmitExamResult',
                room_id: studentInfo.roomId,
                peer_id: studentInfo.peerId,
                score,
                total,
                exam_name: 'Proctored Exam'
            });
            console.log('Exam result submitted to server');
        }
    }, [studentInfo.roomId, studentInfo.peerId]);

    useEffect(() => {
        const init = async () => {
            try {
                // Start media first
                await startMedia();
                console.log('Media started, waiting for state update...');
            } catch (err) {
                console.error('Failed to initialize media:', err);
            }
        };
        init();
    }, [startMedia]);


    useEffect(() => {
        if (localStream) {
            console.log('LocalStream is ready, sending Join message');


            const timer = setTimeout(() => {
                send({
                    type: 'Join',
                    room_id: studentInfo.roomId,
                    peer_id: studentInfo.peerId,
                    name: studentInfo.name,
                    role: 'student',
                    wallet_address: studentInfo.walletAddress || undefined
                });
                console.log('Participant joined with wallet:', studentInfo.walletAddress);
            }, 100);

            return () => clearTimeout(timer);
        }
    }, [localStream, send, studentInfo]);

    useEffect(() => {
        if (proctorVideoRef.current && proctorStream) {
            proctorVideoRef.current.srcObject = proctorStream;
        }
    }, [proctorStream]);

    useEffect(() => {
        if (studentVideoRef.current && localStream) {
            studentVideoRef.current.srcObject = localStream;
        }
    }, [localStream]);

    const handleLeave = () => {
        if (confirm('Are you sure you want to leave?')) {
            send({
                type: 'Leave',
                peer_id: studentInfo.peerId
            });
            window.location.reload();
        }
    };

    // Show waiting screen while connecting to proctor
    if (isWaitingForProctor) {
        return (
            <div className="flex flex-col h-screen">
                <ConnectionStatus />
                <div className="bg-gray-100 border-b border-gray-300 p-4 px-8 flex justify-between items-center">
                    <h1 className="text-gray-800 text-2xl font-semibold">Connecting...</h1>
                    <div className="text-gray-600 text-sm">
                        {studentInfo.name} • Room: {studentInfo.roomId}
                    </div>
                </div>
                <div className="flex-1 flex items-center justify-center bg-gray-50">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-6"></div>
                        <h2 className="text-xl font-semibold text-gray-700 mb-2">Waiting for Proctor</h2>
                        <p className="text-gray-500">Please wait while the proctor accepts your request...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-gray-100">
            <ConnectionStatus />
            {/* Header */}
            <div className="bg-white border-b border-gray-300 p-4 px-8 flex justify-between items-center">
                <h1 className="text-gray-800 text-2xl font-semibold">Proctored Exam</h1>
                <div className="text-gray-600 text-sm">
                    {studentInfo.name} • Room: {studentInfo.roomId}
                    {testCompleted && testScore && (
                        <span className="ml-4 text-green-600 font-medium">
                            Score: {testScore.score}/{testScore.total}
                        </span>
                    )}
                </div>
                <button
                    className="py-2 px-6 bg-danger text-white border-0 rounded-lg cursor-pointer hover:bg-red-600"
                    onClick={handleLeave}
                >
                    Leave
                </button>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden pb-20">
                {/* Test Area */}
                <div className="flex-1 overflow-y-auto p-6">
                    <DummyTest
                        studentName={studentInfo.name}
                        onComplete={handleTestComplete}
                    />
                </div>

                {/* Video Sidebar */}
                <div className="w-80 bg-gray-900 flex flex-col">
                    {/* Proctor Video */}
                    <div className="flex-1 relative">
                        {proctorStream ? (
                            <>
                                <video
                                    ref={proctorVideoRef}
                                    className="w-full h-full object-cover"
                                    autoPlay
                                    playsInline
                                />
                                <div className="absolute bottom-2 left-2 bg-black/70 text-white py-1 px-3 rounded text-xs">
                                    Proctor
                                </div>
                            </>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm">
                                Proctor Video
                            </div>
                        )}
                    </div>

                    {/* Student Video (self-view) */}
                    <div className="h-40 relative border-t border-gray-700">
                        {localStream ? (
                            <>
                                <video
                                    ref={studentVideoRef}
                                    className="w-full h-full object-cover -scale-x-100"
                                    autoPlay
                                    muted
                                    playsInline
                                />
                                <div className="absolute bottom-2 left-2 bg-black/70 text-white py-1 px-3 rounded text-xs">
                                    You
                                </div>
                            </>
                        ) : (
                            <div className="w-full h-full bg-gray-800 flex items-center justify-center text-gray-500 text-sm">
                                Your Video
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom Controls */}
            <div className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-md p-4 px-8 flex justify-center z-[200]">
                <MediaControls
                    isVideoOn={isVideoEnabled}
                    isAudioOn={isAudioEnabled}
                    onToggleVideo={toggleVideo}
                    onToggleAudio={toggleAudio}
                />
            </div>
        </div>
    );
}
