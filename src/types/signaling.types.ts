// Base message type
export type SignalingMessage =
    | CreateRoomMessage
    | RoomCreatedMessage
    | JoinRequestMessage
    | JoinResponseMessage
    | JoinMessage
    | LeaveMessage
    | OfferMessage
    | AnswerMessage
    | IceCandidateMessage
    | RenegotiateMessage
    | MediaReadyMessage
    | JoinRequestSentMessage
    | JoinApprovedMessage
    | JoinDeniedMessage
    | ErrorMessage
    | KickParticipantMessage
    | ParticipantKickedMessage
    | ParticipantLeftMessage
    | ReportSuspiciousActivityMessage
    | SuspiciousActivityReportedMessage
    | SubmitExamResultMessage
    | ExamResultSubmittedMessage
    | EndExamMessage;

// Outgoing messages (Client → Server)
export interface CreateRoomMessage {
    type: 'CreateRoom';
    peer_id: string;
    name?: string;
    wallet_address?: string;
}

export interface JoinRequestMessage {
    type: 'JoinRequest';
    room_id: string;
    peer_id: string;
    name?: string;
    role: string;
    wallet_address?: string;
}

export interface JoinMessage {
    type: 'Join';
    room_id: string;
    peer_id: string;
    name?: string;
    role: string;
    wallet_address?: string;
}

export interface JoinResponseMessage {
    type: 'JoinResponse';
    room_id: string;
    peer_id: string;
    requester_peer_id: string;
    approved: boolean;
}

export interface LeaveMessage {
    type: 'Leave';
    peer_id: string;
}

export interface AnswerMessage {
    type: 'Answer';
    peer_id: string;
    sdp: string;
}

export interface IceCandidateMessage {
    type: 'IceCandidate';
    peer_id: string;
    candidate: string;
    sdp_mid?: string;
    sdp_mline_index?: number;
}

export interface MediaReadyMessage {
    type: 'MediaReady';
    peer_id: string;
    has_video: boolean;
    has_audio: boolean;
}

// Incoming messages (Server → Client)
export interface RoomCreatedMessage {
    type: 'RoomCreated';
    room_id: string;
}

export interface OfferMessage {
    type: 'offer';
    sdp: string;
    peer_id?: string;
}

export interface RenegotiateMessage {
    type: 'renegotiate';
    sdp: string;
}

export interface JoinRequestSentMessage {
    type: 'join_request_sent';
    message: string;
}

export interface JoinApprovedMessage {
    type: 'join_approved';
    room_id: string;
    message: string;
}

export interface JoinDeniedMessage {
    type: 'join_denied';
    room_id: string;
    message: string;
}

export interface ErrorMessage {
    type: 'error';
    message: string;
}

// Proctor action messages
export interface KickParticipantMessage {
    type: 'KickParticipant';
    room_id: string;
    peer_id: string;
    reason?: string;
}

export interface ParticipantKickedMessage {
    type: 'ParticipantKicked';
    room_id: string;
    peer_id: string;
    reason?: string;
}

export interface ParticipantLeftMessage {
    type: 'ParticipantLeft';
    room_id: string;
    peer_id: string;
    name?: string;
}

export interface ReportSuspiciousActivityMessage {
    type: 'ReportSuspiciousActivity';
    room_id: string;
    peer_id: string;
    activity_type: string; // "multiple_devices", "tab_switch", "window_blur", "screen_share", "unauthorized_person", "audio_anomaly", "other"
    details?: string;
}

export interface SuspiciousActivityReportedMessage {
    type: 'SuspiciousActivityReported';
    room_id: string;
    peer_id: string;
    activity_type: string;
}

// Exam result messages
export interface SubmitExamResultMessage {
    type: 'SubmitExamResult';
    room_id: string;
    peer_id: string;
    score: number;      // Score achieved (e.g., 4 out of 5)
    total: number;      // Total possible (e.g., 5)
    exam_name?: string;
}

export interface ExamResultSubmittedMessage {
    type: 'ExamResultSubmitted';
    room_id: string;
    peer_id: string;
    grade: number;      // Grade in basis points (8000 = 80.00%)
}

// Exam control messages
export interface EndExamMessage {
    type: 'EndExam';
    room_id: string;
    peer_id: string;
}
