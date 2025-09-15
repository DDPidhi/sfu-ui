import { useState } from 'react';

interface StudentJoinFormProps {
    onJoin: (name: string, roomId: string) => void;
}

export default function StudentJoinForm({ onJoin }: StudentJoinFormProps) {
    const [name, setName] = useState('');
    const [roomId, setRoomId] = useState('');
    const [status, setStatus] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!name || roomId.length !== 6) {
            setStatus('Please enter your name and a valid 6-digit room ID');
            return;
        }

        setStatus('Requesting to join...');
        // Simulate approval delay
        setTimeout(() => {
            onJoin(name, roomId);
        }, 1500);
    };

    return (
        <div className="join-page">
            <div className="join-card">
                <h1>Join Class</h1>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Your Name</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Enter your full name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Room ID</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Enter 6-digit room ID"
                            maxLength={6}
                            value={roomId}
                            onChange={(e) => setRoomId(e.target.value.replace(/\D/g, ''))}
                            required
                        />
                    </div>
                    <button type="submit" className="join-btn">
                        Join Class
                    </button>
                </form>
                {status && (
                    <div className="status-message info">{status}</div>
                )}
            </div>
        </div>
    );
}
