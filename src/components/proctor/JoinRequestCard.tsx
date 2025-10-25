import type {JoinRequest} from "../../types/room.types.ts";

interface JoinRequestCardProps {
    request: JoinRequest;
    onApprove: (peerId: string) => void;
    onDeny: (peerId: string) => void;
}

export default function JoinRequestCard({ request, onApprove, onDeny }: JoinRequestCardProps) {
    return (
        <div className="bg-white rounded-xl p-4 mb-4 shadow-lg">
            <div className="font-semibold mb-2 text-gray-800">Join Request</div>
            <div className="text-gray-600 text-sm mb-4">
                Name: {request.name}
            </div>
            <div className="flex gap-2">
                <button
                    className="flex-1 py-2 rounded-md border-0 font-medium cursor-pointer bg-success text-white hover:bg-emerald-600"
                    onClick={() => onApprove(request.peer_id)}
                >
                    Approve
                </button>
                <button
                    className="flex-1 py-2 rounded-md border-0 font-medium cursor-pointer bg-gray-100 text-gray-800 hover:bg-gray-200"
                    onClick={() => onDeny(request.peer_id)}
                >
                    Deny
                </button>
            </div>
        </div>
    );
}
