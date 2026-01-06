import { useState, useEffect, useRef } from 'react';
import type { MediaDeviceInfo } from '../../hooks/useMediaDevices';

interface DeviceSelectorProps {
    isOpen: boolean;
    cameras: MediaDeviceInfo[];
    microphones: MediaDeviceInfo[];
    onSelect: (cameraId: string | null, microphoneId: string | null) => void;
    onCancel?: () => void;
    error?: string | null;
}

const isMacOS = (): boolean => {
    return navigator.platform.toUpperCase().indexOf('MAC') >= 0 ||
        navigator.userAgent.toUpperCase().indexOf('MAC') >= 0;
};

const isIPhoneDevice = (label: string): boolean => {
    const lowerLabel = label.toLowerCase();
    return lowerLabel.includes('iphone') || lowerLabel.includes('continuity');
};

export default function DeviceSelector({
    isOpen,
    cameras,
    microphones,
    onSelect,
    onCancel,
    error
}: DeviceSelectorProps) {
    const [selectedCamera, setSelectedCamera] = useState<string | null>(null);
    const [selectedMicrophone, setSelectedMicrophone] = useState<string | null>(null);
    const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [localCameras, setLocalCameras] = useState<MediaDeviceInfo[]>(cameras);
    const [localMicrophones, setLocalMicrophones] = useState<MediaDeviceInfo[]>(microphones);
    const videoRef = useRef<HTMLVideoElement>(null);

    // Sync props to local state
    useEffect(() => {
        setLocalCameras(cameras);
        setLocalMicrophones(microphones);
    }, [cameras, microphones]);

    // Auto-refresh on open to get proper device labels
    useEffect(() => {
        if (isOpen && localCameras.length === 0 && localMicrophones.length === 0) {
            refreshDevices();
        }
    }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

    const refreshDevices = async () => {
        setIsRefreshing(true);
        try {
            // Request permission first to get proper device labels
            try {
                const tempStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                tempStream.getTracks().forEach(t => t.stop());
            } catch {
                // Permission denied or no devices, continue with enumeration anyway
            }

            const devices = await navigator.mediaDevices.enumerateDevices();
            const newCameras = devices
                .filter(d => d.kind === 'videoinput')
                .map((d, idx) => ({
                    deviceId: d.deviceId,
                    label: d.label || `Camera ${idx + 1}`,
                    kind: 'videoinput' as const
                }));
            const newMicrophones = devices
                .filter(d => d.kind === 'audioinput')
                .map((d, idx) => ({
                    deviceId: d.deviceId,
                    label: d.label || `Microphone ${idx + 1}`,
                    kind: 'audioinput' as const
                }));

            setLocalCameras(newCameras);
            setLocalMicrophones(newMicrophones);

            // Auto-select first device if none selected
            if (newCameras.length > 0 && !selectedCamera) {
                setSelectedCamera(newCameras[0].deviceId);
            }
            if (newMicrophones.length > 0 && !selectedMicrophone) {
                setSelectedMicrophone(newMicrophones[0].deviceId);
            }
        } catch (err) {
            console.error('Failed to refresh devices:', err);
        } finally {
            setIsRefreshing(false);
        }
    };

    // Set defaults when devices are available
    useEffect(() => {
        if (localCameras.length > 0 && !selectedCamera) {
            setSelectedCamera(localCameras[0].deviceId);
        }
        if (localMicrophones.length > 0 && !selectedMicrophone) {
            setSelectedMicrophone(localMicrophones[0].deviceId);
        }
    }, [localCameras, localMicrophones, selectedCamera, selectedMicrophone]);

    // Preview camera when selection changes
    useEffect(() => {
        if (!isOpen || !selectedCamera) return;

        let mounted = true;
        const startPreview = async () => {
            try {
                // Stop existing preview
                if (previewStream) {
                    previewStream.getTracks().forEach(t => t.stop());
                }

                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { deviceId: { exact: selectedCamera } },
                    audio: false
                });

                if (mounted) {
                    setPreviewStream(stream);
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                    }
                } else {
                    stream.getTracks().forEach(t => t.stop());
                }
            } catch (err) {
                console.error('Preview failed:', err);
            }
        };

        startPreview();

        return () => {
            mounted = false;
        };
    }, [selectedCamera, isOpen]);

    // Cleanup on close
    useEffect(() => {
        if (!isOpen && previewStream) {
            previewStream.getTracks().forEach(t => t.stop());
            setPreviewStream(null);
        }
    }, [isOpen, previewStream]);

    const handleConfirm = () => {
        // Stop preview before confirming
        if (previewStream) {
            previewStream.getTracks().forEach(t => t.stop());
            setPreviewStream(null);
        }
        onSelect(selectedCamera, selectedMicrophone);
    };

    if (!isOpen) return null;

    const hasNoCameras = localCameras.length === 0;
    const hasNoMicrophones = localMicrophones.length === 0;

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[300]">
            <div className="bg-gray-900 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl border border-gray-700">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-white text-xl font-semibold">Select Devices</h2>
                    <button
                        onClick={refreshDevices}
                        disabled={isRefreshing}
                        className="text-sm text-gray-400 hover:text-white flex items-center gap-1 disabled:opacity-50"
                    >
                        <span className={isRefreshing ? 'animate-spin' : ''}>↻</span>
                        {isRefreshing ? 'Scanning...' : 'Refresh'}
                    </button>
                </div>

                {error && (
                    <div className="bg-red-500/20 border border-red-500 text-red-200 rounded-lg p-3 mb-4 text-sm">
                        {error}
                    </div>
                )}

                {/* Camera Preview */}
                <div className="mb-4">
                    <div className="aspect-video bg-gray-800 rounded-lg overflow-hidden mb-2">
                        {selectedCamera ? (
                            <video
                                ref={videoRef}
                                autoPlay
                                muted
                                playsInline
                                className="w-full h-full object-cover -scale-x-100"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-500">
                                No camera selected
                            </div>
                        )}
                    </div>
                </div>

                {/* Camera Selection */}
                <div className="mb-4">
                    <label className="block text-gray-300 text-sm font-medium mb-2">
                        Camera
                    </label>
                    {hasNoCameras ? (
                        <div className="text-gray-500 text-sm p-3 bg-gray-800 rounded-lg">
                            <p>No cameras found</p>
                            {isMacOS() && (
                                <p className="mt-2 text-gray-400">
                                    <span className="text-blue-400">Tip:</span> You can use your iPhone as a camera with Continuity Camera.
                                    Make sure your iPhone is nearby, unlocked, and connected to the same Wi-Fi network.
                                </p>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {localCameras.map((camera) => {
                                const isIPhone = isMacOS() && isIPhoneDevice(camera.label);
                                const isSelected = selectedCamera === camera.deviceId;
                                return (
                                    <button
                                        key={camera.deviceId}
                                        onClick={() => setSelectedCamera(camera.deviceId)}
                                        className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors text-left ${
                                            isSelected
                                                ? 'bg-primary/20 border-primary text-white'
                                                : 'bg-gray-800 border-gray-600 text-gray-300 hover:border-gray-500'
                                        }`}
                                    >
                                        {isIPhone && (
                                            <span className="flex-shrink-0 w-6 h-6 bg-gray-700 rounded-md flex items-center justify-center text-sm">
                                                📱
                                            </span>
                                        )}
                                        <span className="flex-1 truncate">{camera.label}</span>
                                        {isIPhone && (
                                            <span className="flex-shrink-0 text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded">
                                                iPhone
                                            </span>
                                        )}
                                        {isSelected && (
                                            <span className="flex-shrink-0 text-primary">✓</span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Microphone Selection */}
                <div className="mb-6">
                    <label className="block text-gray-300 text-sm font-medium mb-2">
                        Microphone
                    </label>
                    {hasNoMicrophones ? (
                        <div className="text-gray-500 text-sm p-3 bg-gray-800 rounded-lg">
                            <p>No microphones found</p>
                            {isMacOS() && (
                                <p className="mt-2 text-gray-400">
                                    <span className="text-blue-400">Tip:</span> Your iPhone can also provide microphone input via Continuity Camera.
                                </p>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {localMicrophones.map((mic) => {
                                const isIPhone = isMacOS() && isIPhoneDevice(mic.label);
                                const isSelected = selectedMicrophone === mic.deviceId;
                                return (
                                    <button
                                        key={mic.deviceId}
                                        onClick={() => setSelectedMicrophone(mic.deviceId)}
                                        className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors text-left ${
                                            isSelected
                                                ? 'bg-primary/20 border-primary text-white'
                                                : 'bg-gray-800 border-gray-600 text-gray-300 hover:border-gray-500'
                                        }`}
                                    >
                                        {isIPhone && (
                                            <span className="flex-shrink-0 w-6 h-6 bg-gray-700 rounded-md flex items-center justify-center text-sm">
                                                📱
                                            </span>
                                        )}
                                        <span className="flex-1 truncate">{mic.label}</span>
                                        {isIPhone && (
                                            <span className="flex-shrink-0 text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded">
                                                iPhone
                                            </span>
                                        )}
                                        {isSelected && (
                                            <span className="flex-shrink-0 text-primary">✓</span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    {onCancel && (
                        <button
                            onClick={onCancel}
                            className="flex-1 py-3 px-4 rounded-lg bg-gray-700 text-white font-medium hover:bg-gray-600 transition-colors"
                        >
                            Cancel
                        </button>
                    )}
                    <button
                        onClick={handleConfirm}
                        disabled={!selectedCamera && !selectedMicrophone}
                        className="flex-1 py-3 px-4 rounded-lg bg-primary text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Continue
                    </button>
                </div>

                {hasNoCameras && hasNoMicrophones && (
                    <div className="text-gray-400 text-sm text-center mt-4">
                        <p>No devices available. Please connect a camera or microphone and try again.</p>
                        {isMacOS() && (
                            <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg text-left">
                                <p className="text-blue-300 font-medium mb-1">📱 Use your iPhone as a camera</p>
                                <ol className="text-gray-400 text-xs space-y-1 list-decimal list-inside">
                                    <li>Make sure your iPhone and Mac are signed into the same Apple ID</li>
                                    <li>Enable Wi-Fi and Bluetooth on both devices</li>
                                    <li>Bring your iPhone close to your Mac</li>
                                    <li>Refresh this page to detect your iPhone</li>
                                </ol>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
