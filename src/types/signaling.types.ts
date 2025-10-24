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
    | ErrorMessage;

// Outgoing messages (Client → Server)
export interface CreateRoomMessage {
    type: 'CreateRoom';
    peer_id: string;
    name?: string;
}

export interface JoinRequestMessage {
    type: 'JoinRequest';
    room_id: string;
    peer_id: string;
    name?: string;
    role: string;
}

export interface JoinMessage {
    type: 'Join';
    room_id: string;
    peer_id: string;
    name?: string;
    role: string;
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
