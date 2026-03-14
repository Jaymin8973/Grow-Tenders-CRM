import { useEffect } from 'react';
import { X, PartyPopper, Check, Calendar, Zap } from 'lucide-react';

interface FreeTrialPopupProps {
  isOpen: boolean;
  onClose: () => void;
  trialEndDate?: string;
}

export function FreeTrialPopup({ isOpen, onClose, trialEndDate }: FreeTrialPopupProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const formatDate = (date?: string) => {
    if (!date) return '3 days from now';
    const d = new Date(date);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-bounce-in"
        style={{ animation: 'bounceIn 0.5s ease-out' }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
        >
          <X size={20} />
        </button>

        {/* Header with gradient */}
        <div
          className="relative px-6 pt-8 pb-6 text-center"
          style={{
            background: 'linear-gradient(135deg, #f5820d 0%, #ff9a3c 100%)',
          }}
        >
          {/* Confetti effect */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 rounded-full animate-fall"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `-10px`,
                  backgroundColor: ['#fff', '#ffd700', '#ff6b6b', '#4ecdc4', '#45b7d1'][Math.floor(Math.random() * 5)],
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${2 + Math.random() * 2}s`,
                }}
              />
            ))}
          </div>

          <div className="relative">
            <div className="w-20 h-20 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center">
              <PartyPopper size={40} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Congratulations! 🎉
            </h2>
            <p className="text-white/90 text-lg">
              You've unlocked your 3-Day Free Trial!
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: '#fef3e2' }}
              >
                <Check size={16} style={{ color: '#f5820d' }} />
              </div>
              <div>
                <p className="font-medium text-gray-800">Full Access Granted</p>
                <p className="text-sm text-gray-500">Access all tender features for 3 days</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: '#fef3e2' }}
              >
                <Calendar size={16} style={{ color: '#f5820d' }} />
              </div>
              <div>
                <p className="font-medium text-gray-800">Trial Valid Until</p>
                <p className="text-sm text-gray-500">{formatDate(trialEndDate)}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: '#fef3e2' }}
              >
                <Zap size={16} style={{ color: '#f5820d' }} />
              </div>
              <div>
                <p className="font-medium text-gray-800">Instant Activation</p>
                <p className="text-sm text-gray-500">Start exploring tenders right away!</p>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full mt-6 py-3 rounded-xl text-white font-semibold transition-opacity hover:opacity-90"
            style={{ background: '#f5820d' }}
          >
            Start Exploring Now
          </button>

          <p className="mt-4 text-center text-xs text-gray-400">
            No credit card required • Cancel anytime
          </p>
        </div>
      </div>

      <style>{`
        @keyframes bounceIn {
          0% {
            opacity: 0;
            transform: scale(0.3);
          }
          50% {
            transform: scale(1.05);
          }
          70% {
            transform: scale(0.9);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes fall {
          0% {
            transform: translateY(-10px) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(200px) rotate(360deg);
            opacity: 0;
          }
        }

        .animate-fall {
          animation: fall linear infinite;
        }
      `}</style>
    </div>
  );
}
