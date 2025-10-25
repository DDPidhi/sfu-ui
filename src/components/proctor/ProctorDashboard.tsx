import {useCallback, useEffect, useRef, useState} from 'react';
import StudentCard from './StudentCard';
import JoinRequestCard from './JoinRequestCard';
import MediaControls from "../shared/MediaControls.tsx";
import {ConnectionStatus} from "../shared/ConnectionStatus.tsx";
import type {JoinRequest, StudentInfo} from "../../types/room.types.ts";
import {useMediaDevices} from "../../hooks/useMediaDevices.ts";
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

    useEffect(() => {
        studentNamesRef.current = studentNames;
    }, [studentNames]);

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
        }
    }, [handleOffer, handleRenegotiation, addIceCandidate, peerId]);

    const { connect, send } = useWebSocket(handleMessage);

    useEffect(() => {
        const init = async () => {
            try {
                await startMedia();
                await connect();
                console.log('Proctor initialized');
            } catch (err) {
                console.error('Initialization failed:', err);
            }
        };
        init();
    }, [startMedia, connect]);


    const handleStartRoom = () => {
        send({
            type: 'CreateRoom',
            peer_id: peerId,
            name: 'Proctor'
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

    return (
        <div className="min-h-screen flex flex-col">
            <ConnectionStatus />
            {/* Header */}
            <header className="bg-gray-100 border-b border-gray-300 p-4 px-8 flex justify-between items-center">
                <h1 className="text-gray-800 text-2xl font-semibold">Proctor Dashboard</h1>
                <div>
                    {!roomId ? (
                        <button
                            onClick={handleStartRoom}
                            disabled={!localStream}
                            className="py-2 px-6 rounded-lg border-0 text-sm font-medium cursor-pointer transition-all duration-300 bg-primary text-white hover:-translate-y-0.5 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
                        >
                            {localStream ? 'Start Room' : 'Initializing...'}
                        </button>
                    ) : (
                        <div>Room ID: <strong>{roomId}</strong></div>
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

            {/* Participants Grid */}
            <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6 p-8 flex-1">
                {Array.from(students.values()).map(student => (
                    <StudentCard key={student.id} student={student} />
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
                        className="w-full h-full object-cover"
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
