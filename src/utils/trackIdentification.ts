// Enable detailed logging only in development
const DEBUG_TRACKS = import.meta.env.DEV;

export const extractPeerIdFromTrack = (trackId: string, streamId: string): string | null => {
    if (DEBUG_TRACKS) {
        console.log('Extracting peer ID from:', { trackId, streamId });
    }

    let peerId: string | null = null;

    // Strategy 1: Extract from stream ID (e.g., "student-xxxxx_stream")
    if (streamId && (streamId.includes('student-') || streamId.includes('proctor-'))) {
        const match = streamId.match(/((?:student|proctor)-[a-z0-9]+)/);
        if (match) {
            peerId = match[1];
            if (DEBUG_TRACKS) {
                console.log('Extracted from stream ID:', peerId);
            }
            return peerId;
        }
    }

    // Strategy 2: Extract from track ID (e.g., "student-xxxxx_video_originalId")
    if (trackId) {
        const parts = trackId.split('_');
        if (parts.length >= 1 && (parts[0].includes('student') || parts[0].includes('proctor'))) {
            peerId = parts[0];
            if (DEBUG_TRACKS) {
                console.log('Extracted from track ID (split):', peerId);
            }
            return peerId;
        }

        // Fallback: regex match
        const match = trackId.match(/((?:student|proctor)-[a-z0-9]+)/);
        if (match) {
            peerId = match[1];
            if (DEBUG_TRACKS) {
                console.log('Extracted from track ID (regex):', peerId);
            }
            return peerId;
        }
    }

    if (DEBUG_TRACKS) {
        console.warn('Could not extract peer ID from:', { trackId, streamId });
    }
    return null;
};

export const isStudentTrack = (peerId: string | null): boolean => {
    return peerId !== null && peerId.includes('student') && !peerId.includes('proctor');
};

export const isProctorTrack = (peerId: string | null): boolean => {
    return peerId !== null && peerId.includes('proctor');
};
