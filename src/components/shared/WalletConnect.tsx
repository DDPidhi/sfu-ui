interface WalletConnectProps {
    address: string | null;
    isConnecting: boolean;
    isConnected: boolean;
    error: string | null;
    onConnect: () => void | Promise<unknown>;
    formatAddress: (addr: string | null) => string;
    disabled?: boolean;
}

export default function WalletConnect({
    address,
    isConnecting,
    isConnected,
    error,
    onConnect,
    formatAddress,
    disabled = false,
}: WalletConnectProps) {
    if (isConnected && address) {
        return (
            <div className="flex items-center gap-2 px-4 py-2 bg-green-100 border border-green-300 rounded-xl">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-green-700 font-medium text-sm">
                    {formatAddress(address)}
                </span>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <button
                type="button"
                onClick={onConnect}
                disabled={isConnecting || disabled}
                className="w-full p-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white border-0 rounded-xl text-lg font-semibold cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-orange-500/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none flex items-center justify-center gap-3"
            >
                <svg className="w-6 h-6" viewBox="0 0 35 33" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M32.958 1L19.514 11.065L21.975 5.112L32.958 1Z" fill="#E17726"/>
                    <path d="M2.042 1L15.362 11.153L13.025 5.112L2.042 1Z" fill="#E27625"/>
                    <path d="M28.18 23.533L24.727 28.847L32.308 30.938L34.506 23.65L28.18 23.533Z" fill="#E27625"/>
                    <path d="M0.507 23.65L2.692 30.938L10.273 28.847L6.82 23.533L0.507 23.65Z" fill="#E27625"/>
                    <path d="M9.939 14.504L7.828 17.676L15.421 18.022L15.147 9.906L9.939 14.504Z" fill="#E27625"/>
                    <path d="M25.061 14.504L19.779 9.818L19.514 18.022L27.107 17.676L25.061 14.504Z" fill="#E27625"/>
                    <path d="M10.273 28.847L14.957 26.638L10.914 23.709L10.273 28.847Z" fill="#E27625"/>
                    <path d="M20.043 26.638L24.727 28.847L24.086 23.709L20.043 26.638Z" fill="#E27625"/>
                </svg>
                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </button>
            {error && (
                <p className="text-red-500 text-sm text-center">{error}</p>
            )}
        </div>
    );
}
