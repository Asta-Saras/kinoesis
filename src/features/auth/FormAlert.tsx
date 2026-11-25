import { AlertCircle } from 'lucide-react';

interface FormAlertProps {
  message: string;
  action?: { label: string; onClick: () => void };
}

export function FormAlert({ message, action }: FormAlertProps) {
  return (
    <div role="alert" className="flex animate-fade-up items-start gap-2.5 rounded-lg border border-red-500/30 bg-red-500/[0.08] px-3 py-2.5 text-[13px] text-red-200">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
      <div className="flex-1">
        {message}
        {action && (
          <button type="button" onClick={action.onClick} className="ml-1.5 cursor-pointer font-semibold text-white underline-offset-2 hover:underline">
            {action.label} →
          </button>
        )}
      </div>
    </div>
  );
}
