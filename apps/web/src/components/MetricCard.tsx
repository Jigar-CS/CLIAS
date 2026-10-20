import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  color?: 'indigo' | 'emerald' | 'amber' | 'blue' | 'rose' | 'purple';
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'rose',
}: MetricCardProps) {
  // gleam-spark palette: coral primary, steel-blue secondary, warm parchment surfaces
  const colorStyles = {
    indigo: {
      border: 'border-[rgba(74,111,165,0.28)] hover:border-[#e05033]/50',
      iconBg: 'bg-[#e05033] text-white',
      accentBar: 'bg-[#e05033]',
      valueColor: 'text-[#1a2540] dark:text-[#e8edf5]',
    },
    emerald: {
      border: 'border-[rgba(74,111,165,0.28)] hover:border-emerald-500/50',
      iconBg: 'bg-emerald-600 text-white',
      accentBar: 'bg-emerald-600',
      valueColor: 'text-[#1a2540] dark:text-[#e8edf5]',
    },
    amber: {
      border: 'border-[rgba(74,111,165,0.28)] hover:border-amber-500/50',
      iconBg: 'bg-amber-600 text-white',
      accentBar: 'bg-amber-600',
      valueColor: 'text-[#1a2540] dark:text-[#e8edf5]',
    },
    blue: {
      border: 'border-[rgba(74,111,165,0.28)] hover:border-[#4a6fa5]/60',
      iconBg: 'bg-[#4a6fa5] text-white',
      accentBar: 'bg-[#4a6fa5]',
      valueColor: 'text-[#1a2540] dark:text-[#e8edf5]',
    },
    rose: {
      border: 'border-[rgba(74,111,165,0.28)] hover:border-[#e05033]/50',
      iconBg: 'bg-[#e05033] text-white',
      accentBar: 'bg-[#e05033]',
      valueColor: 'text-[#1a2540] dark:text-[#e8edf5]',
    },
    purple: {
      border: 'border-[rgba(74,111,165,0.28)] hover:border-purple-500/50',
      iconBg: 'bg-purple-600 text-white',
      accentBar: 'bg-purple-600',
      valueColor: 'text-[#1a2540] dark:text-[#e8edf5]',
    },
  };

  const style = colorStyles[color] || colorStyles.rose;

  return (
    <div
      className={`bg-[#faf7f2] dark:bg-[#121b30] p-5 border ${style.border} shadow-sm hover:shadow-md transition-all duration-200 relative overflow-hidden group`}
      style={{ borderRadius: 0 }}
    >
      {/* gleam-spark accent bar on top */}
      <div className={`absolute top-0 left-0 right-0 h-0.5 ${style.accentBar}`} />

      <div className="flex items-start justify-between gap-3 relative z-10">
        <div className="min-w-0 flex-1">
          {/* gleam-spark .mono label */}
          <p className="font-mono text-[10px] font-medium text-[#4a6fa5] dark:text-[#6a90c5] uppercase tracking-widest truncate">
            {title}
          </p>
          <div className="flex items-baseline gap-2 mt-2 flex-wrap">
            {/* gleam-spark .display value */}
            <h3 className="font-display text-3xl text-[#1a2540] dark:text-[#e8edf5] tracking-tight">
              {value}
            </h3>
            {trend && (
              <span
                className={`font-mono text-[9px] font-medium px-2 py-0.5 inline-flex items-center gap-0.5 border ${
                  trend.isPositive
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                    : 'bg-[rgba(224,80,51,0.08)] text-[#e05033] dark:text-[#e8604a] border-[rgba(224,80,51,0.3)]'
                }`}
                style={{ borderRadius: 0 }}
              >
                {trend.isPositive ? '↑' : '↓'} {trend.value}
              </span>
            )}
          </div>
        </div>

        <div
          className={`w-11 h-11 flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${style.iconBg}`}
          style={{ borderRadius: 0 }}
        >
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );
}
