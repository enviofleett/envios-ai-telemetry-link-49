
import React from 'react';

interface SignalIndicatorProps {
  strength: number; // 0-5
}

const SignalIndicator: React.FC<SignalIndicatorProps> = ({ strength }) => {
  const getSignalColor = (strength: number) => {
    if (strength >= 4) return 'text-green-600';
    if (strength >= 2) return 'text-yellow-600';
    return 'text-red-600';
  };

  const color = getSignalColor(strength);

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-end gap-0.5">
        {[1, 2, 3, 4, 5].map((bar) => (
          <div
            key={bar}
            className={`w-1 rounded-sm ${
              bar <= strength ? color : 'text-gray-300'
            } ${
              bar === 1 ? 'h-2' :
              bar === 2 ? 'h-3' :
              bar === 3 ? 'h-4' :
              bar === 4 ? 'h-5' : 'h-6'
            } bg-current`}
          />
        ))}
      </div>
      <span className={`text-xs font-medium ${color}`}>
        {strength}/5
      </span>
    </div>
  );
};

export default SignalIndicator;
