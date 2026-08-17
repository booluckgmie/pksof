import { Component, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
  onReset: () => void;
}

interface State {
  error: Error | null;
}

/** Keeps a crash on one screen from taking down the whole app (sidebar, nav, everything) —
 * without this, an uncaught render error anywhere unmounts the entire React tree. Resets
 * automatically when `key` changes (App.tsx keys this by the current screen id). */
export class ScreenErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("Screen crashed:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex flex-col items-center justify-center text-center gap-3 rounded-lg border border-dashed border-[hsl(var(--pk-bad))] py-16 px-6">
          <div className="h-10 w-10 rounded-full bg-[hsl(var(--pk-bad-soft))] flex items-center justify-center">
            <AlertTriangle className="h-4 w-4 text-[hsl(var(--pk-bad))]" />
          </div>
          <div className="font-head text-lg font-semibold text-[hsl(var(--pk-ink))]">This screen hit an error</div>
          <p className="text-sm text-[hsl(var(--pk-ink-faint))] max-w-[46ch]">
            {this.state.error.message || "Something went wrong rendering this screen."} Try another screen from the sidebar, or reload.
          </p>
          <button
            onClick={() => {
              this.setState({ error: null });
              this.props.onReset();
            }}
            className="mt-1 rounded-md bg-[hsl(var(--pk-accent))] text-[hsl(var(--pk-accent-ink))] text-xs font-medium px-3 py-1.5 hover:opacity-90 transition-opacity"
          >
            Back to Main Screen
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
