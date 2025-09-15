interface JoinRequestCardProps {
    request: {
        id: string;
        name: string;
        peerId: string;
    };
    onApprove: (peerId: string) => void;
    onDeny: (peerId: string) => void;
}

export default function JoinRequestCard({ request, onApprove, onDeny }: JoinRequestCardProps) {
    return (
        <div className="join-request">
            <div className="join-request-header">Student Join Request</div>
            <div className="join-request-info">
                Name: {request.name}
            </div>
            <div className="join-request-actions">
                <button
                    className="approve-btn"
                    onClick={() => onApprove(request.peerId)}
                >
                    Approve
                </button>
                <button
                    className="deny-btn"
                    onClick={() => onDeny(request.peerId)}
                >
                    Deny
                </button>
            </div>
        </div>
    );
}
