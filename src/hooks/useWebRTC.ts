import { useState, useRef, useCallback } from 'react';

interface UseWebRTCProps {
    localStream: MediaStream | null;
    onRemoteTrack?: (event: RTCTrackEvent) => void;
}

export const useWebRTC = ({ localStream, onRemoteTrack }: UseWebRTCProps) => {
    const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null);
    const pcRef = useRef<RTCPeerConnection | null>(null);
    const onIceCandidateRef = useRef<((candidate: RTCIceCandidate) => void) | null>(null);

    const createPeerConnection = useCallback((onIceCandidate: (candidate: RTCIceCandidate) => void) => {
        console.log('🔗 Creating peer connection');

        const pc = new RTCPeerConnection({
            iceServers: [{ urls: import.meta.env.VITE_STUN_SERVER_URL }]
        });

        // Add local tracks
        if (localStream) {
            localStream.getTracks().forEach(track => {
                console.log('Adding local track:', track.kind, track.id);
                pc.addTrack(track, localStream);
            });
        }

        // Handle remote tracks
        pc.ontrack = (event) => {
            console.log('Received remote track:', event.track.kind, event.track.id);
            if (onRemoteTrack) {
                onRemoteTrack(event);
            }
        };

        // Handle ICE candidates
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                console.log('ICE candidate generated');
                onIceCandidate(event.candidate);
            }
        };

        // Connection state logging
        pc.onconnectionstatechange = () => {
            console.log('Connection state:', pc.connectionState);
        };

        pc.oniceconnectionstatechange = () => {
            console.log('ICE connection state:', pc.iceConnectionState);
        };

        pcRef.current = pc;
        onIceCandidateRef.current = onIceCandidate;
        setPeerConnection(pc);

        return pc;
    }, [localStream, onRemoteTrack]);

    const handleOffer = useCallback(async (
        sdp: string,
        onIceCandidate: (candidate: RTCIceCandidate) => void
    ): Promise<string> => {
        console.log('📨 Handling offer from SFU');

        let pc = pcRef.current;
        if (!pc) {
            pc = createPeerConnection(onIceCandidate);
        }

        await pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp }));
        console.log('Remote description set');

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        console.log('Answer created and local description set');

        return answer.sdp!;
    }, [createPeerConnection]);

    const handleRenegotiation = useCallback(async (sdp: string): Promise<string> => {
        console.log('🔄 Handling renegotiation from SFU');

        const pc = pcRef.current;
        if (!pc) {
            console.error('No peer connection for renegotiation');
            throw new Error('No peer connection');
        }

        await pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp }));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        console.log('Renegotiation answer created');

        return answer.sdp!;
    }, []);

    const addIceCandidate = useCallback(async (candidate: RTCIceCandidateInit) => {
        const pc = pcRef.current;
        if (pc) {
            try {
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
                console.log('ICE candidate added');
            } catch (err) {
                console.error('Failed to add ICE candidate:', err);
            }
        }
    }, []);

    const close = useCallback(() => {
        if (pcRef.current) {
            console.log('Closing peer connection');
            pcRef.current.close();
            pcRef.current = null;
            setPeerConnection(null);
        }
    }, []);

    return {
        peerConnection,
        handleOffer,
        handleRenegotiation,
        addIceCandidate,
        close
    };
};
