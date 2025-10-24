import { useState, useEffect, useCallback, useRef } from 'react';

export const useMediaDevices = () => {
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const [isAudioEnabled, setIsAudioEnabled] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const streamRef = useRef<MediaStream | null>(null);

    const startMedia = useCallback(async (constraints = { video: true, audio: true }) => {
        try {
            console.log('🎥 Requesting media access...');
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            console.log('✅ Media access granted');

            streamRef.current = stream;
            setLocalStream(stream);
            setError(null);
            return stream;
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Failed to access media';
            console.error('❌ Media access failed:', errorMsg);
            setError(errorMsg);
            throw err;
        }
    }, []);

    const stopMedia = useCallback(() => {
        if (streamRef.current) {
            console.log('🛑 Stopping media tracks');
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
            setLocalStream(null);
        }
    }, []);

    const toggleVideo = useCallback(() => {
        if (streamRef.current) {
            const enabled = !isVideoEnabled;
            streamRef.current.getVideoTracks().forEach(track => {
                track.enabled = enabled;
            });
            setIsVideoEnabled(enabled);
            console.log(`📹 Video ${enabled ? 'enabled' : 'disabled'}`);
        }
    }, [isVideoEnabled]);

    const toggleAudio = useCallback(() => {
        if (streamRef.current) {
            const enabled = !isAudioEnabled;
            streamRef.current.getAudioTracks().forEach(track => {
                track.enabled = enabled;
            });
            setIsAudioEnabled(enabled);
            console.log(`🎤 Audio ${enabled ? 'enabled' : 'disabled'}`);
        }
    }, [isAudioEnabled]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopMedia();
        };
    }, [stopMedia]);

    return {
        localStream,
        isVideoEnabled,
        isAudioEnabled,
        error,
        startMedia,
        stopMedia,
        toggleVideo,
        toggleAudio
    };
};
