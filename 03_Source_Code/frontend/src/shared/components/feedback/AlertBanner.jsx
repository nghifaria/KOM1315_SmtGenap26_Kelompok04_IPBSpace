import React from 'react';
import { WarningCircle, Info, CheckCircle, XCircle } from '@phosphor-icons/react';

export default function AlertBanner({ type = 'info', title, message, icon: CustomIcon }) {
  const typeConfig = {
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      iconColor: 'text-red-500',
      icon: XCircle,
    },
    warning: {
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      text: 'text-orange-800',
      iconColor: 'text-orange-500',
      icon: WarningCircle,
    },
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-800',
      iconColor: 'text-green-500',
      icon: CheckCircle,
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      iconColor: 'text-blue-500',
      icon: Info,
    },
  };

  const config = typeConfig[type] || typeConfig.info;
  const Icon = CustomIcon || config.icon;

  return (
    <div className={`p-4 rounded-xl border ${config.bg} ${config.border} flex gap-3 items-start`}>
      <Icon size={24} weight="fill" className={`shrink-0 mt-0.5 ${config.iconColor}`} />
      <div>
        {title && <h4 className={`font-bold text-sm ${config.text} mb-1`}>{title}</h4>}
        <p className={`text-xs leading-relaxed ${config.text} opacity-90`}>{message}</p>
      </div>
    </div>
  );
}
