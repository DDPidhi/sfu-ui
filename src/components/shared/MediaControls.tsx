interface MediaControlsProps {
    isVideoOn: boolean;
    isAudioOn: boolean;
    onToggleVideo: () => void;
    onToggleAudio: () => void;
}

export default function MediaControls({
                                          isVideoOn,
                                          isAudioOn,
                                          onToggleVideo,
                                          onToggleAudio
                                      }: MediaControlsProps) {
    return (
        <div className="flex gap-4">
            <button
                className={`w-12 h-12 rounded-full border-0 text-white text-2xl flex items-center justify-center cursor-pointer transition-all duration-300 hover:bg-white/20 ${
                    isAudioOn ? 'bg-success' : 'bg-danger'
                }`}
                onClick={onToggleAudio}
                title="Toggle Microphone"
            >
                🎤
            </button>
            <button
                className={`w-12 h-12 rounded-full border-0 text-white text-2xl flex items-center justify-center cursor-pointer transition-all duration-300 hover:bg-white/20 ${
                    isVideoOn ? 'bg-success' : 'bg-danger'
                }`}
                onClick={onToggleVideo}
                title="Toggle Camera"
            >
                📹
            </button>
            <button
                className="w-12 h-12 rounded-full border-0 bg-white/10 text-white text-2xl flex items-center justify-center cursor-pointer transition-all duration-300 hover:bg-white/20"
                title="Settings"
            >
                ⚙️
            </button>
        </div>
    );
}
