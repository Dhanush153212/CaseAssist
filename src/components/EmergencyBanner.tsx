import { PhoneCall, X } from 'lucide-react';

interface EmergencyBannerProps {
  flags: string[];
  onDismiss: () => void;
}

export default function EmergencyBanner({ flags, onDismiss }: EmergencyBannerProps) {
  if (!flags || flags.length === 0) return null;

  return (
    <aside className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white shadow-md z-40 border-b border-red-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white text-red-600 flex items-center justify-center font-bold text-lg flex-shrink-0 animate-bounce">
            !
          </div>
          <div>
            <div className="font-extrabold text-sm sm:text-base tracking-wide flex items-center gap-2">
              <span>RED FLAG CLINICAL ALERT</span>
              <span className="bg-red-900/60 text-red-100 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">
                Triage Immediate
              </span>
            </div>
            <p className="text-xs text-red-100 mt-0.5">
              Detected emergency indicators: <strong>{flags.join(', ')}</strong>. Please report to AIIA Casualty / Emergency Station without delay.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <a
            href="tel:+911126950401"
            className="inline-flex items-center gap-1.5 bg-white text-red-700 hover:bg-red-50 text-xs font-extrabold px-3 py-1.5 rounded-lg shadow-sm transition-all"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Emergency: 108 / 011-26950401</span>
          </a>
          <button
            onClick={onDismiss}
            className="p-1 text-red-200 hover:text-white rounded-lg hover:bg-red-800/50 transition-colors"
            title="Dismiss Emergency Banner"
            aria-label="Dismiss banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
