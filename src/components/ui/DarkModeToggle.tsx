
import React from 'react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/components/settings/branding/ThemeProvider';
import { Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DarkModeToggleProps {
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export const DarkModeToggle: React.FC<DarkModeToggleProps> = ({
  size = 'md',
  showLabel = false,
  className
}) => {
  const { isDarkMode, toggleDarkMode, isLoading } = useTheme();

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-9 w-9',
    lg: 'h-10 w-10'
  };

  const iconSizes = {
    sm: 16,
    md: 18,
    lg: 20
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleDarkMode}
      disabled={isLoading}
      className={cn(
        sizeClasses[size],
        'transition-all duration-300 hover:bg-accent',
        showLabel && 'w-auto px-3 gap-2',
        className
      )}
      aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
    >
      <div className="relative">
        {/* Sun icon */}
        <Sun
          size={iconSizes[size]}
          className={cn(
            'absolute transition-all duration-300',
            isDarkMode
              ? 'scale-0 rotate-90 opacity-0'
              : 'scale-100 rotate-0 opacity-100'
          )}
        />
        {/* Moon icon */}
        <Moon
          size={iconSizes[size]}
          className={cn(
            'transition-all duration-300',
            isDarkMode
              ? 'scale-100 rotate-0 opacity-100'
              : 'scale-0 -rotate-90 opacity-0'
          )}
        />
      </div>
      {showLabel && (
        <span className="text-sm font-medium">
          {isDarkMode ? 'Light' : 'Dark'}
        </span>
      )}
    </Button>
  );
};
