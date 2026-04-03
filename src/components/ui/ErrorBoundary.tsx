import { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-[200px] p-8">
          <div className="max-w-md text-center space-y-4">
            <div className="w-12 h-12 bg-error/10 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle size={24} className="text-error" />
            </div>
            <h3 className="font-manrope font-bold text-lg">
              {this.props.fallbackTitle || '화면을 표시할 수 없습니다'}
            </h3>
            <p className="text-sm text-on-surface-variant">
              {this.state.error?.message || '예기치 않은 오류가 발생했습니다.'}
            </p>
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:opacity-90 transition-opacity"
            >
              <RefreshCw size={14} /> 다시 시도
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
