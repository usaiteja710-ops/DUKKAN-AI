import React from 'react';
import { Check } from 'lucide-react';

export function BookingStepper({ currentStep = 1, steps = ['Select Service', 'Pick Date & Time', 'Your Details', 'Confirm'] }) {
  return (
    <div className="w-full py-4 mb-6" aria-label="Booking progress">
      <div className="flex items-center justify-between max-w-2xl mx-auto px-4">
        {steps.map((label, idx) => {
          const stepNum = idx + 1;
          const isCompleted = stepNum < currentStep;
          const isCurrent = stepNum === currentStep;

          return (
            <React.Fragment key={label}>
              <div className="flex flex-col items-center text-center">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 ${
                    isCompleted
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : isCurrent
                      ? 'bg-brand-600 text-white shadow-md ring-4 ring-brand-100 dark:ring-brand-950'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                  }`}
                >
                  {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : stepNum}
                </div>
                <span
                  className={`mt-2 text-xs font-medium hidden sm:block ${
                    isCurrent
                      ? 'text-brand-600 dark:text-brand-400 font-semibold'
                      : isCompleted
                      ? 'text-slate-800 dark:text-slate-200'
                      : 'text-slate-400'
                  }`}
                >
                  {label}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 sm:mx-4 transition-colors ${
                    stepNum < currentStep ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

