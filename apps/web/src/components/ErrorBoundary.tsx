import { Component, type ErrorInfo, type ReactNode } from 'react';

type Props = {
  children: ReactNode;
  fallback?: ReactNode;
};

type State = {
  hasError: boolean;
  error: Error | null;
};

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 text-center">
          <p className="font-title text-2xl uppercase text-accent">Algo deu errado</p>
          <p className="max-w-md font-body text-sm text-text-secondary">
            Ocorreu um erro inesperado. Tente recarregar a página.
          </p>
          <button
            onClick={this.handleReset}
            className="rounded-lg bg-accent px-6 py-3 font-bold uppercase text-black transition hover:opacity-90"
          >
            Tentar novamente
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
