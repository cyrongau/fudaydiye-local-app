import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-900 p-6">
                    <div className="max-w-md w-full bg-white dark:bg-zinc-800 p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-white/5 text-center">
                        <div className="size-16 bg-red-100 dark:bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
                            <span className="material-symbols-outlined text-3xl">error</span>
                        </div>
                        <h1 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-2">System Error</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 font-medium">
                            Important component node crashed.
                        </p>
                        <div className="bg-gray-100 dark:bg-black/20 p-4 rounded-xl text-left overflow-auto mb-6 max-h-32">
                            <code className="text-[10px] font-mono text-red-500 break-all">
                                {this.state.error?.message}
                            </code>
                        </div>
                        <button
                            onClick={() => window.location.reload()}
                            className="w-full h-12 bg-primary text-secondary rounded-xl font-bold uppercase tracking-widest hover:bg-primary-dark transition-colors"
                        >
                            Restart Session
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
