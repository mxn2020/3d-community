// components/error-boundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallbackUI?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
    errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
    };

    public static getDerivedStateFromError(error: Error): State {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // You can also log the error to an error reporting service
        console.error("ErrorBoundary caught an error:", error, errorInfo);
        this.setState({ errorInfo });
        // Example: logErrorToMyService(error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            // You can render any custom fallback UI
            if (this.props.fallbackUI) {
                return this.props.fallbackUI; 1
            }
            return (
                <div style={{
                    position: 'fixed', // Floating overlay
                    top: '0',
                    left: '0',
                    width: '100vw',
                    height: '100vh',
                    backgroundColor: 'rgba(0, 0, 0, 0.85)',
                    color: 'white',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 9999, // Ensure it's on top of everything
                    padding: '20px',
                    textAlign: 'left',
                    boxSizing: 'border-box',
                    fontFamily: 'sans-serif',
                }}>
                    <h2 style={{ color: '#ff6b6b', marginBottom: '20px' }}>Oops! A 3D Scene Error Occurred.</h2>
                    <p style={{ marginBottom: '10px' }}>We're sorry, something went wrong while rendering the scene.</p>
                    {this.state.error && (
                        <pre style={{
                            backgroundColor: '#333',
                            color: '#f1f1f1',
                            padding: '15px',
                            borderRadius: '5px',
                            maxWidth: '80%',
                            overflowX: 'auto',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-all',
                            marginBottom: '20px',
                        }}>
                            <strong>Error:</strong> {this.state.error.toString()}
                            {this.state.errorInfo && (
                                <>
                                    <br />
                                    <br />
                                    <strong>Stack Trace:</strong>
                                    <br />
                                    {this.state.errorInfo.componentStack}
                                </>
                            )}
                        </pre>
                    )}
                    <p>Try refreshing the page. If the problem persists, please contact support.</p>
                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            padding: '10px 20px',
                            marginTop: '20px',
                            fontSize: '16px',
                            color: 'white',
                            backgroundColor: '#4ECDC4',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer',
                        }}
                    >
                        Refresh Page
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;