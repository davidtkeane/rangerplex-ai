import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: Error | null; errorInfo: React.ErrorInfo | null }> {
    constructor(props: any) {
        super(props)
        this.state = { hasError: false, error: null, errorInfo: null }
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo)
        this.setState({ errorInfo })
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: 40, color: '#ff5555', background: '#1e1e1e', height: '100vh', overflow: 'auto', fontFamily: 'monospace' }}>
                    <h1 style={{ marginBottom: 20 }}>💥 RangerChat Crashed</h1>
                    <h3 style={{ color: '#fff' }}>{this.state.error?.toString()}</h3>
                    <details style={{ whiteSpace: 'pre-wrap', marginTop: 20, color: '#aaa' }}>
                        <summary style={{ cursor: 'pointer', marginBottom: 10 }}>View Stack Trace</summary>
                        {this.state.errorInfo?.componentStack}
                    </details>
                    <button
                        onClick={() => window.location.reload()}
                        style={{ marginTop: 20, padding: '10px 20px', background: '#444', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                    >
                        Reload App
                    </button>
                </div>
            )
        }

        return this.props.children
    }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <ErrorBoundary>
            <App />
        </ErrorBoundary>
    </React.StrictMode>,
)
