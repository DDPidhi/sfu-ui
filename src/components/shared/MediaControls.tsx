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
        <div className="media-controls">
            <button
                className={`control-btn ${isAudioOn ? 'active' : 'inactive'}`}
                onClick={onToggleAudio}
                title="Toggle Microphone"
            >
                🎤
            </button>
            <button
                className={`control-btn ${isVideoOn ? 'active' : 'inactive'}`}
                onClick={onToggleVideo}
                title="Toggle Camera"
            >
                📹
            </button>
            <button className="control-btn" title="Settings">
                ⚙️
            </button>
        </div>
    );
}
