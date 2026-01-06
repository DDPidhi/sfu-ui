import { useState, useEffect, useCallback, useRef } from 'react';

export interface MediaDeviceInfo {
    deviceId: string;
    label: string;
    kind: 'videoinput' | 'audioinput' | 'audiooutput';
}

export const useMediaDevices = () => {
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const [isAudioEnabled, setIsAudioEnabled] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
    const [availableMicrophones, setAvailableMicrophones] = useState<MediaDeviceInfo[]>([]);
    const [needsDeviceSelection, setNeedsDeviceSelection] = useState(true); // Show selector on load
    const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);
    const [selectedMicrophoneId, setSelectedMicrophoneId] = useState<string | null>(null);

    const streamRef = useRef<MediaStream | null>(null);

    const enumerateDevices = useCallback(async (): Promise<{
        cameras: MediaDeviceInfo[];
        microphones: MediaDeviceInfo[];
    }> => {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const cameras = devices
                .filter(d => d.kind === 'videoinput')
                .map((d, idx) => ({
                    deviceId: d.deviceId,
                    label: d.label || `Camera ${idx + 1}`,
                    kind: 'videoinput' as const
                }));
            const microphones = devices
                .filter(d => d.kind === 'audioinput')
                .map((d, idx) => ({
                    deviceId: d.deviceId,
                    label: d.label || `Microphone ${idx + 1}`,
                    kind: 'audioinput' as const
                }));

            setAvailableCameras(cameras);
            setAvailableMicrophones(microphones);

            return { cameras, microphones };
        } catch (err) {
            console.error('Failed to enumerate devices:', err);
            return { cameras: [], microphones: [] };
        }
    }, []);

    const startMedia = useCallback(async (
        constraints: MediaStreamConstraints = {
            video: true,
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            }
        },
        retries = 0
    ): Promise<MediaStream> => {
        try {
            console.log('Requesting media access...');
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            console.log('Media access granted');

            streamRef.current = stream;
            setLocalStream(stream);
            setError(null);
            setNeedsDeviceSelection(false);
            return stream;
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Failed to access media';
            const isNotFoundError = err instanceof Error &&
                (err.name === 'NotFoundError' || err.message.includes('Requested device not found'));

            console.error('Media access failed:', errorMsg);

            // If device not found, enumerate devices and prompt for selection
            if (isNotFoundError) {
                console.log('Device not found, checking available devices...');
                const { cameras, microphones } = await enumerateDevices();

                if (cameras.length > 0 || microphones.length > 0) {
                    console.log('Available cameras:', cameras.length, 'Available microphones:', microphones.length);
                    setNeedsDeviceSelection(true);
                    setError('Please select a camera and microphone from available devices.');
                    throw err;
                }
            }

            // Retry with degraded constraints if initial attempt fails (non-device-not-found errors)
            if (retries < 2 && !isNotFoundError) {
                console.log('Retrying with degraded quality...');
                const degradedConstraints: MediaStreamConstraints = {
                    video: retries === 0 ? { width: 640, height: 480 } : true,
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true
                    }
                };
                return startMedia(degradedConstraints, retries + 1);
            }

            setError(errorMsg);
            throw err;
        }
    }, [enumerateDevices]);

    const startMediaWithDevices = useCallback(async (
        cameraId: string | null,
        microphoneId: string | null
    ): Promise<MediaStream> => {
        setSelectedCameraId(cameraId);
        setSelectedMicrophoneId(microphoneId);

        const constraints: MediaStreamConstraints = {
            video: cameraId ? { deviceId: { exact: cameraId } } : false,
            audio: microphoneId ? {
                deviceId: { exact: microphoneId },
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            } : false
        };

        // At least one must be enabled
        if (!cameraId && !microphoneId) {
            throw new Error('At least one device must be selected');
        }

        return startMedia(constraints, 3); // Skip retries for explicit device selection
    }, [startMedia]);

    const stopMedia = useCallback(() => {
        if (streamRef.current) {
            console.log('Stopping media tracks');
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
            console.log(`Video ${enabled ? 'enabled' : 'disabled'}`);
        }
    }, [isVideoEnabled]);

    const toggleAudio = useCallback(() => {
        if (streamRef.current) {
            const enabled = !isAudioEnabled;
            streamRef.current.getAudioTracks().forEach(track => {
                track.enabled = enabled;
            });
            setIsAudioEnabled(enabled);
            console.log(`Audio ${enabled ? 'enabled' : 'disabled'}`);
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
        toggleAudio,
        availableCameras,
        availableMicrophones,
        needsDeviceSelection,
        enumerateDevices,
        startMediaWithDevices,
        selectedCameraId,
        selectedMicrophoneId
    };
};
