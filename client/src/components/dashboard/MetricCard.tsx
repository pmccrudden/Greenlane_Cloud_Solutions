import { ArrowDown, ArrowUp } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: number | string;
  change: number;
  changeLabel: string;
  changeType?: "increase" | "decrease";
  badge?: string;
  badgeColor?: string;
  loading?: boolean;
}

export default function MetricCard({
  title,
  value,
  change,
  changeLabel,
  changeType = "increase",
  badge,
  badgeColor = "green",
  loading = false,
}: MetricCardProps) {
  // Map color names to Tailwind classes
  const badgeColorMap: Record<string, string> = {
    green: "bg-green-100 text-green-800",
    red: "bg-red-100 text-red-800",
    yellow: "bg-yellow-100 text-yellow-800",
    blue: "bg-blue-100 text-blue-800",
    purple: "bg-purple-100 text-purple-800",
    gray: "bg-slate-100 text-slate-800",
  };

  const changeColorClass = changeType === "increase" ? "text-green-500" : "text-red-500";
  const ChangeIcon = changeType === "increase" ? ArrowUp : ArrowDown;

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-5 animate-pulse">
        <div className="flex justify-between items-center mb-3">
          <div className="h-4 bg-slate-200 rounded w-1/3"></div>
          <div className="h-6 bg-slate-200 rounded-full w-16"></div>
        </div>
        <div className="flex items-end justify-between">
          <div className="h-8 bg-slate-200 rounded w-1/4"></div>
          <div className="h-6 bg-slate-200 rounded w-1/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-5">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-slate-500 text-sm font-medium">{title}</h3>
        {badge && (
          <span className={`${badgeColorMap[badgeColor] || badgeColorMap.green} text-xs px-2 py-1 rounded-full`}>
            {badge}
          </span>
        )}
      </div>
      <div className="flex items-end justify-between">
        <p className="text-2xl font-semibold">{value}</p>
        <div className={`flex items-center ${changeColorClass}`}>
          <ChangeIcon className="w-4 h-4" />
          <span className="text-sm ml-1">{`${Math.abs(change)}% ${changeLabel}`}</span>
        </div>
      </div>
    </div>
  );
}
