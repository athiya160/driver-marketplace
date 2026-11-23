import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('Sarathi App Crash Caught by ErrorBoundary:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleHardReset = () => {
    try {
      if (typeof localStorage !== 'undefined') localStorage.clear();
      if (typeof sessionStorage !== 'undefined') sessionStorage.clear();
      if ('caches' in window) {
        caches.keys().then((keys) => {
          keys.forEach((key) => caches.delete(key));
        });
      }
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          registrations.forEach((registration) => registration.unregister());
        });
      }
    } catch (e) {
      console.warn('Error clearing cache:', e);
    }
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-2xl">
            <div className="w-16 h-16 bg-orange-500/20 text-orange-400 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl font-bold">
              !
            </div>
            <h1 className="text-xl font-bold text-white mb-2">
              Sarathi App Notice
            </h1>
            <p className="text-sm text-slate-300 mb-6">
              A temporary interface error occurred. You can reload the application or reset your cached local data.
            </p>
            {this.state.error && (
              <div className="bg-slate-950 text-slate-400 text-xs p-3 rounded-lg text-left mb-6 font-mono overflow-auto max-h-32 border border-slate-800">
                {this.state.error.toString()}
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={this.handleReload}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-medium py-2.5 px-4 rounded-xl transition-colors shadow-lg shadow-orange-500/20 text-sm"
              >
                Reload Page
              </button>
              <button
                onClick={this.handleHardReset}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-medium py-2.5 px-4 rounded-xl transition-colors text-sm"
              >
                Clear Cache & Reset
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
