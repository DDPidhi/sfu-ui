import '@testing-library/jest-dom';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock MediaStream
class MockMediaStream {
  id = `mock-stream-${Math.random()}`;
  active = true;
  private tracks: MediaStreamTrack[] = [];

  constructor(tracks?: MediaStreamTrack[]) {
    if (tracks) {
      this.tracks = tracks;
    }
  }

  getTracks() {
    return this.tracks;
  }

  getVideoTracks() {
    return this.tracks.filter(t => t.kind === 'video');
  }

  getAudioTracks() {
    return this.tracks.filter(t => t.kind === 'audio');
  }

  addTrack(track: MediaStreamTrack) {
    this.tracks.push(track);
  }

  removeTrack(track: MediaStreamTrack) {
    this.tracks = this.tracks.filter(t => t !== track);
  }
}

// Mock MediaStreamTrack
class MockMediaStreamTrack extends EventTarget {
  kind: string;
  id = `mock-track-${Math.random()}`;
  private _enabled = true;
  muted = false;
  readyState: 'live' | 'ended' = 'live';
  label = '';

  constructor(kind: 'video' | 'audio') {
    super();
    this.kind = kind;
    this.label = `Mock ${kind} track`;
  }

  get enabled() {
    return this._enabled;
  }

  set enabled(value: boolean) {
    this._enabled = value;
  }

  stop() {
    this.readyState = 'ended';
  }

  clone() {
    return new MockMediaStreamTrack(this.kind as 'video' | 'audio');
  }

  getCapabilities() {
    return {};
  }

  getConstraints() {
    return {};
  }

  getSettings() {
    return {};
  }

  applyConstraints() {
    return Promise.resolve();
  }
}

// Mock getUserMedia
const mockGetUserMedia = vi.fn().mockImplementation(async (constraints) => {
  const tracks: MediaStreamTrack[] = [];
  if (constraints?.video) {
    tracks.push(new MockMediaStreamTrack('video') as unknown as MediaStreamTrack);
  }
  if (constraints?.audio) {
    tracks.push(new MockMediaStreamTrack('audio') as unknown as MediaStreamTrack);
  }
  return new MockMediaStream(tracks) as unknown as MediaStream;
});

// Mock RTCPeerConnection
class MockRTCPeerConnection {
  localDescription: RTCSessionDescription | null = null;
  remoteDescription: RTCSessionDescription | null = null;
  signalingState: RTCSignalingState = 'stable';
  iceConnectionState: RTCIceConnectionState = 'new';
  connectionState: RTCPeerConnectionState = 'new';
  onicecandidate: ((event: RTCPeerConnectionIceEvent) => void) | null = null;
  ontrack: ((event: RTCTrackEvent) => void) | null = null;
  oniceconnectionstatechange: (() => void) | null = null;
  onnegotiationneeded: (() => void) | null = null;

  private senders: RTCRtpSender[] = [];

  constructor() {
    // Simulate successful connection after a delay
    setTimeout(() => {
      this.iceConnectionState = 'connected';
      this.connectionState = 'connected';
      if (this.oniceconnectionstatechange) {
        this.oniceconnectionstatechange();
      }
    }, 100);
  }

  async createOffer() {
    return {
      type: 'offer',
      sdp: 'mock-offer-sdp',
    } as RTCSessionDescriptionInit;
  }

  async createAnswer() {
    return {
      type: 'answer',
      sdp: 'mock-answer-sdp',
    } as RTCSessionDescriptionInit;
  }

  async setLocalDescription(description: RTCSessionDescriptionInit) {
    this.localDescription = description as RTCSessionDescription;
    // Trigger ICE candidate event
    setTimeout(() => {
      if (this.onicecandidate) {
        this.onicecandidate({
          candidate: {
            candidate: 'mock-ice-candidate',
            sdpMid: '0',
            sdpMLineIndex: 0,
          } as RTCIceCandidate,
        } as RTCPeerConnectionIceEvent);
        // Signal end of candidates
        this.onicecandidate({ candidate: null } as RTCPeerConnectionIceEvent);
      }
    }, 50);
  }

  async setRemoteDescription(description: RTCSessionDescriptionInit) {
    this.remoteDescription = description as RTCSessionDescription;
    this.signalingState = 'stable';
  }

  async addIceCandidate(candidate: RTCIceCandidateInit) {
    // Mock implementation
    return Promise.resolve();
  }

  addTrack(track: MediaStreamTrack, stream: MediaStream) {
    const sender = {
      track,
      replaceTrack: vi.fn().mockResolvedValue(undefined),
    } as unknown as RTCRtpSender;
    this.senders.push(sender);
    return sender;
  }

  getSenders() {
    return this.senders;
  }

  close() {
    this.connectionState = 'closed';
    this.iceConnectionState = 'closed';
  }
}

// Mock WebSocket
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  url: string;
  readyState = MockWebSocket.CONNECTING;
  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;

  constructor(url: string) {
    this.url = url;
    // Simulate successful connection
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      if (this.onopen) {
        this.onopen(new Event('open'));
      }
    }, 10);
  }

  send(data: string) {
    if (this.readyState !== MockWebSocket.OPEN) {
      throw new Error('WebSocket is not open');
    }
    // Mock send
  }

  close() {
    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) {
      this.onclose(new CloseEvent('close'));
    }
  }
}

// Apply mocks to global
global.MediaStream = MockMediaStream as any;
global.RTCPeerConnection = MockRTCPeerConnection as any;
global.WebSocket = MockWebSocket as any;

Object.defineProperty(navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: mockGetUserMedia,
    enumerateDevices: vi.fn().mockResolvedValue([
      { kind: 'videoinput', deviceId: 'mock-camera', label: 'Mock Camera' },
      { kind: 'audioinput', deviceId: 'mock-mic', label: 'Mock Microphone' },
    ]),
  },
});

// Mock environment variables
vi.stubEnv('VITE_WS_URL', 'ws://localhost:8080/sfu');
vi.stubEnv('VITE_STUN_SERVER_URL', 'stun:stun.l.google.com:19302');

// Export mocks for test usage
export { mockGetUserMedia, MockWebSocket, MockRTCPeerConnection, MockMediaStream, MockMediaStreamTrack };