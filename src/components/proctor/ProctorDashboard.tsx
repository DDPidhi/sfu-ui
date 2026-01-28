import {useCallback, useEffect, useRef, useState} from 'react';
import StudentCard from './StudentCard';
import JoinRequestCard from './JoinRequestCard';
import MediaControls from "../shared/MediaControls.tsx";
import {ConnectionStatus} from "../shared/ConnectionStatus.tsx";
import DeviceSelector from "../shared/DeviceSelector.tsx";
import WalletConnect from "../shared/WalletConnect.tsx";
import type {JoinRequest, StudentInfo} from "../../types/room.types.ts";
import {useMediaDevices} from "../../hooks/useMediaDevices.ts";
import {useWallet} from "../../hooks/useWallet.ts";
import {extractPeerIdFromTrack, isStudentTrack} from "../../utils/trackIdentification.ts";
import {useWebRTC} from "../../hooks/useWebRTC.ts";
import {useWebSocket} from "../../hooks/useWebSocket.ts";
import type {SignalingMessage} from "../../types/signaling.types.ts";


export default function ProctorDashboard() {
    const [roomId, setRoomId] = useState<string | null>(null);
    const [peerId] = useState(`proctor-${Math.random().toString(36).substr(2, 9)}`);
    const [students, setStudents] = useState<Map<string, StudentInfo>>(new Map());
    const [studentNames, setStudentNames] = useState<Map<string, string>>(new Map());
    const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);

    const studentNamesRef = useRef<Map<string, string>>(new Map());

    const {
        address: walletAddress,
        isConnecting: isWalletConnecting,
        isConnected: isWalletConnected,
        error: walletError,
        connect: connectWallet,
        formatAddress,
    } = useWallet();

    useEffect(() => {
        studentNamesRef.current = studentNames;
    }, [studentNames]);

    const {
        localStream,
        isVideoEnabled,
        isAudioEnabled,
        error: mediaError,
        toggleVideo,
        toggleAudio,
        availableCameras,
        availableMicrophones,
        needsDeviceSelection,
        startMediaWithDevices,
        enumerateDevices
    } = useMediaDevices();

    const handleRemoteTrack = useCallback((event: RTCTrackEvent) => {
        const { track, streams } = event;

        console.log('Remote track received:', {
            kind: track.kind,
            trackId: track.id,
            streamId: streams[0]?.id,
            streamsCount: streams.length
        });

        const stream = streams[0];
        if (!stream) {
            console.warn('No stream in track event');
            return;
        }

        const studentId = extractPeerIdFromTrack(track.id, stream.id);
        console.log('Extracted participant ID:', studentId);

        if (studentId === peerId) {
            console.log('Ignoring proctor\'s own track');
            return;
        }

        if (studentId && isStudentTrack(studentId)) {
            console.log('Processing track for student:', studentId, track.kind);

            setStudents(prev => {
                const updated = new Map(prev);
                const existing = updated.get(studentId);

                let mediaStream: MediaStream;
                if (existing?.stream) {
                    mediaStream = existing.stream;
                    console.log('Adding', track.kind, 'track to existing stream for:', studentId);
                } else {
                    mediaStream = new MediaStream();
                    console.log('Created new MediaStream for:', studentId);
                }

                const existingTrackIds = mediaStream.getTracks().map(t => t.id);
                if (!existingTrackIds.includes(track.id)) {
                    mediaStream.addTrack(track);
                    console.log('Added', track.kind, 'track to MediaStream for:', studentId);
                } else {
                    console.log('Track already in stream, skipping');
                }

                const videoTracks = mediaStream.getVideoTracks();
                const audioTracks = mediaStream.getAudioTracks();

                const studentInfo = {
                    id: studentId,
                    name: studentNamesRef.current.get(studentId) || existing?.name || studentId,
                    stream: mediaStream,
                    hasVideo: videoTracks.length > 0 && videoTracks[0].enabled,
                    hasAudio: audioTracks.length > 0 && audioTracks[0].enabled
                };

                console.log('Participant info updated:', {
                    id: studentId,
                    name: studentInfo.name,
                    videoTracks: videoTracks.length,
                    audioTracks: audioTracks.length,
                    totalTracks: mediaStream.getTracks().length
                });

                updated.set(studentId, studentInfo);
                console.log('Total participants now:', updated.size);
                return updated;
            });
        } else {
            console.log('Not a participant track or invalid ID:', studentId);
        }
    }, [peerId]);


    const { handleOffer, handleRenegotiation, addIceCandidate } = useWebRTC({
        localStream,
        onRemoteTrack: handleRemoteTrack
    });

    const handleMessage = useCallback(async (msg: SignalingMessage) => {
        console.log('Received:', msg);
        switch (msg.type) {
            case 'RoomCreated':
                setRoomId(msg.room_id);
                break;

            case 'offer':
                { const answerSdp = await handleOffer(msg.sdp, (candidate) => {
                    send({
                        type: 'IceCandidate',
                        peer_id: peerId,
                        candidate: candidate.candidate,
                        sdp_mid: candidate.sdpMid || undefined,
                        sdp_mline_index: candidate.sdpMLineIndex || undefined
                    });
                });

                send({
                    type: 'Answer',
                    peer_id: peerId,
                    sdp: answerSdp
                });
                break; }

            case 'renegotiate':
                { const renegotiateSdp = await handleRenegotiation(msg.sdp);
                send({
                    type: 'Answer',
                    peer_id: peerId,
                    sdp: renegotiateSdp
                });
                break; }

            case 'JoinRequest':
                console.log('Join request from:', msg.peer_id, msg.name);
                if (msg.name) {
                    setStudentNames(prev => new Map(prev).set(msg.peer_id, msg.name!));
                    setStudents(prev => {
                        const updated = new Map(prev);
                        const existing = updated.get(msg.peer_id);
                        if (existing) {
                            updated.set(msg.peer_id, { ...existing, name: msg.name! });
                            console.log('Updated existing participant name:', msg.peer_id, msg.name);
                        }
                        return updated;
                    });
                }
                setJoinRequests(prev => [...prev, {
                    id: msg.peer_id,
                    peer_id: msg.peer_id,
                    name: msg.name
                }]);
                break;

            case 'IceCandidate':
                if (msg.candidate) {
                    await addIceCandidate({
                        candidate: msg.candidate,
                        sdpMid: msg.sdp_mid,
                        sdpMLineIndex: msg.sdp_mline_index
                    });
                }
                break;

            case 'ParticipantLeft':
                console.log('Participant left:', msg.peer_id, msg.name);
                // Remove the student from local state
                setStudents(prev => {
                    const updated = new Map(prev);
                    const studentName = updated.get(msg.peer_id)?.name || msg.name || msg.peer_id;
                    updated.delete(msg.peer_id);
                    console.log(`Student ${studentName} has left the room`);
                    return updated;
                });
                // Also remove from studentNames map
                setStudentNames(prev => {
                    const updated = new Map(prev);
                    updated.delete(msg.peer_id);
                    return updated;
                });
                break;
        }
    }, [handleOffer, handleRenegotiation, addIceCandidate, peerId]);

    const { connect, send } = useWebSocket(handleMessage);

    // Enumerate devices on mount to populate the device selector
    useEffect(() => {
        enumerateDevices();
    }, [enumerateDevices]);


    const handleStartRoom = () => {
        if (!isWalletConnected || !walletAddress) {
            console.error('Wallet not connected');
            return;
        }
        send({
            type: 'CreateRoom',
            peer_id: peerId,
            name: 'Proctor',
            wallet_address: walletAddress,
        });
    };

    const handleApprove = (studentPeerId: string) => {
        console.log('Approving participant:', studentPeerId);
        send({
            type: 'JoinResponse',
            room_id: roomId!,
            peer_id: peerId,
            requester_peer_id: studentPeerId,
            approved: true
        });
        setJoinRequests(prev => prev.filter(r => r.peer_id !== studentPeerId));
    };


    const handleDeny = (studentPeerId: string) => {
        console.log('Denying participant:', studentPeerId);
        send({
            type: 'JoinResponse',
            room_id: roomId!,
            peer_id: peerId,
            requester_peer_id: studentPeerId,
            approved: false
        });
        setJoinRequests(prev => prev.filter(r => r.peer_id !== studentPeerId));
    };

    const handleKickStudent = (studentPeerId: string, reason?: string) => {
        console.log('Kicking student:', studentPeerId, reason);
        send({
            type: 'KickParticipant',
            room_id: roomId!,
            peer_id: studentPeerId,
            reason
        });
        // Remove from local state
        setStudents(prev => {
            const updated = new Map(prev);
            updated.delete(studentPeerId);
            return updated;
        });
    };

    const handleWarnStudent = (studentPeerId: string, message: string) => {
        console.log('Warning student:', studentPeerId, message);
        // For now, just log - could send a message to the student
        alert(`Warning sent to ${students.get(studentPeerId)?.name || studentPeerId}: ${message}`);
    };

    const handleReportSuspicious = (studentPeerId: string, activityType: string, details?: string) => {
        console.log('Reporting suspicious activity:', studentPeerId, activityType, details);
        send({
            type: 'ReportSuspiciousActivity',
            room_id: roomId!,
            peer_id: studentPeerId,
            activity_type: activityType,
            details
        });
        alert(`Suspicious activity reported: ${activityType} for ${students.get(studentPeerId)?.name || studentPeerId}`);
    };

    const handleEndExam = () => {
        if (!roomId) return;
        if (!confirm('Are you sure you want to end the exam? This will close the room for all participants.')) {
            return;
        }
        console.log('Ending exam for room:', roomId);
        send({
            type: 'Leave',
            peer_id: peerId
        });
        // Reset state
        setRoomId(null);
        setStudents(new Map());
        setJoinRequests([]);
    };

    const handleDeviceSelect = async (cameraId: string | null, microphoneId: string | null) => {
        try {
            await startMediaWithDevices(cameraId, microphoneId);
            await connect();
            console.log('Proctor initialized with selected devices');
        } catch (err) {
            console.error('Failed to start with selected devices:', err);
        }
    };

    return (
        <div className="min-h-screen flex flex-col">
            <ConnectionStatus />

            {/* Device Selection Modal */}
            <DeviceSelector
                isOpen={needsDeviceSelection}
                cameras={availableCameras}
                microphones={availableMicrophones}
                onSelect={handleDeviceSelect}
                error={mediaError}
            />
            {/* Header */}
            <header className="bg-gray-100 border-b border-gray-300 p-4 px-8 flex justify-between items-center">
                <h1 className="text-gray-800 text-2xl font-semibold">Proctor Dashboard</h1>
                <div className="flex items-center gap-4">
                    {/* Wallet Connection */}
                    <WalletConnect
                        address={walletAddress}
                        isConnecting={isWalletConnecting}
                        isConnected={isWalletConnected}
                        error={walletError}
                        onConnect={connectWallet}
                        formatAddress={formatAddress}
                        disabled={!!roomId}
                    />

                    {!roomId ? (
                        <button
                            onClick={handleStartRoom}
                            disabled={!localStream || !isWalletConnected}
                            className="py-2 px-6 rounded-lg border-0 text-sm font-medium cursor-pointer transition-all duration-300 bg-primary text-white hover:-translate-y-0.5 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
                        >
                            {!localStream ? 'Initializing...' : !isWalletConnected ? 'Connect Wallet First' : 'Start Room'}
                        </button>
                    ) : (
                        <div className="flex items-center gap-4">
                            <div>Room ID: <strong>{roomId}</strong></div>
                            <button
                                onClick={handleEndExam}
                                className="py-2 px-4 rounded-lg border-0 text-sm font-medium cursor-pointer transition-all duration-300 bg-red-500 text-white hover:bg-red-600 hover:-translate-y-0.5 hover:shadow-xl"
                            >
                                End Exam
                            </button>
                        </div>
                    )}
                </div>
            </header>

            {/* Join Requests */}
            <div className="fixed top-[100px] right-8 w-80 z-[150]">
                {joinRequests.map(req => (
                    <JoinRequestCard
                        key={req.id}
                        request={req}
                        onApprove={handleApprove}
                        onDeny={handleDeny}
                    />
                ))}
            </div>

            {/* Participants Grid - pb-24 for footer space, items-start to prevent stretching */}
            <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6 p-8 pb-24 items-start content-start">
                {Array.from(students.values()).map(student => (
                    <StudentCard
                        key={student.id}
                        student={student}
                        onKick={handleKickStudent}
                        onWarn={handleWarnStudent}
                        onReportSuspicious={handleReportSuspicious}
                    />
                ))}
                {students.size === 0 && (
                    <div className="">
                        <h2>No Students Yet</h2>
                        <p>Waiting for students to join...</p>
                    </div>
                )}
            </div>

            {/* Proctor Video Circle */}
            <div className="fixed bottom-[100px] right-8 w-[180px] h-[180px] rounded-full overflow-hidden border-4 border-white shadow-2xl z-[100]">
                <div className="w-full h-full bg-gray-950 text-gray-600 flex items-center justify-center text-xl">
                    <video
                        ref={video => {
                            if (video && localStream) {
                                video.srcObject = localStream;
                            }
                        }}
                        autoPlay
                        muted
                        playsInline
                        className="w-full h-full object-cover -scale-x-100"
                    />
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-md p-4 px-8 flex justify-between items-center border-t border-white/10 z-[200]">
                <div className="flex gap-8 text-white">
                    <div className="flex items-center gap-2">
                        <span className="opacity-70 text-sm">Room ID:</span>
                        <span className="font-semibold">{roomId || '-'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="opacity-70 text-sm">Students:</span>
                        <span className="font-semibold">{students.size}</span>
                    </div>
                    {walletAddress && (
                        <div className="flex items-center gap-2">
                            <span className="opacity-70 text-sm">Wallet:</span>
                            <span className="font-semibold">{formatAddress(walletAddress)}</span>
                        </div>
                    )}
                </div>

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
