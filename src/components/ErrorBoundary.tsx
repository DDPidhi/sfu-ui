import React, { Component, type ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('ErrorBoundary caught:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex items-center justify-center min-h-screen bg-gray-100">
                    <div className="bg-white p-8 rounded-lg shadow-lg max-w-md">
                        <h2 className="text-xl font-bold text-red-600 mb-4">
                            Something went wrong
                        </h2>
                        <p className="text-gray-700 mb-4">
                            {this.state.error?.message || 'An unexpected error occurred'}
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="bg-primary text-white px-4 py-2 rounded hover:bg-primary-dark"
                        >
                            Reload Page
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
