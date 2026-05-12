import { useState } from 'react';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';

export default function FormWizard({ steps, onComplete }) {
  const [current, setCurrent] = useState(0);
  const [completed, setCompleted] = useState([]);

  const goNext = () => {
    setCompleted((prev) => [...new Set([...prev, current])]);
    if (current < steps.length - 1) setCurrent(current + 1);
    else onComplete?.();
  };

  const goBack = () => {
    if (current > 0) setCurrent(current - 1);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Step indicator */}
      <div className="flex items-center justify-between mb-8">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center flex-1">
            <button
              type="button"
              onClick={() => completed.includes(i) && setCurrent(i)}
              className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition
                ${i === current
                  ? 'bg-[#1a3c2e] text-white border-[#1a3c2e]'
                  : completed.includes(i)
                  ? 'bg-[#B5850A] text-white border-[#B5850A] cursor-pointer'
                  : 'bg-white text-gray-400 border-gray-300'
                }`}
            >
              {completed.includes(i) && i !== current
                ? <Check className="w-4 h-4" />
                : i + 1}
            </button>
            <div className="hidden sm:block ml-2 text-xs font-medium text-gray-600 flex-1">
              {step.title}
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 ${completed.includes(i) ? 'bg-[#B5850A]' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step heading */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-[#1a3c2e]">{steps[current].title}</h2>
        {steps[current].subtitle && (
          <p className="text-sm text-gray-500 mt-1">{steps[current].subtitle}</p>
        )}
      </div>

      {/* Step content */}
      <div className="mb-8">{steps[current].content}</div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          type="button"
          onClick={goBack}
          disabled={current === 0}
          className="flex items-center gap-1 px-5 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold text-sm disabled:opacity-40 hover:border-[#1a3c2e] transition"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <button
          type="button"
          onClick={goNext}
          className="flex items-center gap-1 px-5 py-2.5 rounded-xl bg-[#1a3c2e] text-white font-semibold text-sm hover:bg-[#143326] transition"
        >
          {current === steps.length - 1 ? 'Submit' : 'Next'}
          {current < steps.length - 1 && <ChevronRight className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
