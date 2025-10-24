export interface StudentInfo {
    id: string;
    name: string;
    stream?: MediaStream;
    hasVideo: boolean;
    hasAudio: boolean;
}

export interface JoinRequest {
    id: string;
    peer_id: string;
    name?: string;
}

export interface ProctorState {
    roomId: string | null;
    peerId: string;
    students: Map<string, StudentInfo>;
    joinRequests: JoinRequest[];
}

export interface StudentState {
    name: string;
    roomId: string;
    peerId: string;
    proctorStream: MediaStream | null;
}
