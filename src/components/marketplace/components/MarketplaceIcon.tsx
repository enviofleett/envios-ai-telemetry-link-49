
import React from 'react';
import { icons, LucideProps, Package } from 'lucide-react';

const toPascalCase = (str: string | undefined | null): keyof typeof icons => {
    if (!str) return 'Package';
    // Converts kebab-case or snake_case to PascalCase
    const pascal = str.replace(/([-_][a-z])/ig, ($1) => {
        return $1.toUpperCase()
            .replace('-', '')
            .replace('_', '');
    }).replace(/^./, (match) => match.toUpperCase());

    return pascal as keyof typeof icons;
}

interface MarketplaceIconProps extends LucideProps {
  name: string | null;
}

const MarketplaceIcon = ({ name, ...props }: MarketplaceIconProps) => {
  const iconName = toPascalCase(name);
  const LucideIcon = icons[iconName];

  if (!LucideIcon) {
    return <Package {...props} />;
  }

  return <LucideIcon {...props} />;
};

export default MarketplaceIcon;
