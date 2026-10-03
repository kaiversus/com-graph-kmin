import { LucideIcon } from 'lucide-react';

interface ProgressCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: LucideIcon;
  progress?: number;
  color: string;
}

export function ProgressCard({ title, value, subtitle, icon: Icon, progress, color }: ProgressCardProps) {
  return (
    <div className="bg-card rounded-lg p-6 border border-border">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-muted-foreground text-sm">{title}</p>
          <h3 className="text-3xl mt-1">{value}</h3>
          <p className="text-muted-foreground text-sm mt-1">{subtitle}</p>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      {progress !== undefined && (
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className={`h-2 rounded-full ${color}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}
