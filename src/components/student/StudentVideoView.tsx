import {useCallback, useEffect, useRef, useState} from 'react';
import MediaControls from '../shared/MediaControls';
import {ConnectionStatus} from '../shared/ConnectionStatus';
import {useMediaDevices} from "../../hooks/useMediaDevices.ts";
import {extractPeerIdFromTrack, isProctorTrack} from "../../utils/trackIdentification.ts";
import {useWebRTC} from "../../hooks/useWebRTC.ts";
import type {SignalingMessage} from "../../types/signaling.types.ts";
import {useWebSocket} from "../../hooks/useWebSocket.ts";

interface StudentVideoViewProps {
    studentInfo: {
        name: string;
        roomId: string;
        peerId: string;
    };
}

export default function StudentVideoView({ studentInfo }: StudentVideoViewProps) {
    const [proctorStream, setProctorStream] = useState<MediaStream | null>(null);
    const [isWaitingForProctor, setIsWaitingForProctor] = useState(true);
    const proctorVideoRef = useRef<HTMLVideoElement>(null);
    const studentVideoRef = useRef<HTMLVideoElement>(null);

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
                    role: 'student'
                });
                console.log('Participant joined');
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

    return (
        <div className="flex flex-col h-screen">
            <ConnectionStatus />
            {/* Header */}
            <div className="bg-gray-100 border-b border-gray-300 p-4 px-8 flex justify-between items-center">
                <h1 className="text-gray-800 text-2xl font-semibold">Room Session</h1>
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
                    {proctorStream ? (
                        <>
                            <video
                                ref={proctorVideoRef}
                                className="w-full h-full bg-gray-950 text-gray-600 flex items-center justify-center text-xl"
                                autoPlay
                                playsInline
                            />
                            <div className="absolute bottom-5 left-5 bg-black/70 text-white py-2 px-4 rounded-lg text-sm">
                                👨‍🏫 Proctor
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center text-gray-500">
                            {isWaitingForProctor ? (
                                <>
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                                    <p>Connecting to proctor...</p>
                                </>
                            ) : (
                                <p>Waiting for Proctor...</p>
                            )}
                        </div>
                    )}
                </div>

                {/* Student Side */}
                <div className="w-1/2 bg-gray-950 relative flex items-center justify-center">
                    {localStream ? (
                        <>
                            <video
                                ref={studentVideoRef}
                                className="w-full h-full object-cover"
                                autoPlay
                                muted
                                playsInline
                            />
                            <div className="absolute bottom-5 right-5 bg-black/70 text-white py-2 px-4 rounded-lg text-sm">
                                {studentInfo.name}
                            </div>
                        </>
                    ) : (
                        <div className="w-full h-full bg-gray-950 text-gray-600 flex items-center justify-center text-xl">
                            Your Video
                        </div>
                    )}
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
