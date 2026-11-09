import React from 'react';
import {
  Home,
  Palmtree,
  Globe,
  Leaf,
  TrendingUp,
  Briefcase,
  Landmark,
  Shield,
  HelpCircle,
} from 'lucide-react';

interface BlockIconProps {
  iconName: string;
  className?: string;
}

export const BlockIcon: React.FC<BlockIconProps> = ({ iconName, className = 'w-4 h-4' }) => {
  switch (iconName) {
    case 'Home':
      return <Home className={className} />;
    case 'Palmtree':
      return <Palmtree className={className} />;
    case 'Globe':
      return <Globe className={className} />;
    case 'Leaf':
      return <Leaf className={className} />;
    case 'TrendingUp':
      return <TrendingUp className={className} />;
    case 'Briefcase':
      return <Briefcase className={className} />;
    case 'Landmark':
      return <Landmark className={className} />;
    case 'Shield':
      return <Shield className={className} />;
    default:
      return <HelpCircle className={className} />;
  }
};

