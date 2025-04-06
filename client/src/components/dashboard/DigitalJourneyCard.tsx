import { Link } from "wouter";
import { PlusCircle } from "lucide-react";

interface JourneyItem {
  id: number;
  name: string;
  steps: number;
  emails: number;
  tasks: number;
  status: string;
}

interface DigitalJourneyCardProps {
  journeys: JourneyItem[];
  loading?: boolean;
}

export default function DigitalJourneyCard({
  journeys = [],
  loading = false
}: DigitalJourneyCardProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-5 border-b">
          <h3 className="font-medium text-slate-800">Digital Journey Status</h3>
        </div>
        <div className="p-5 space-y-4 animate-pulse">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="flex items-center justify-between">
              <div>
                <div className="h-4 bg-slate-200 rounded w-32 mb-2"></div>
                <div className="h-3 bg-slate-200 rounded w-40"></div>
              </div>
              <div className="h-5 bg-slate-200 rounded w-16"></div>
            </div>
          ))}
          <div className="pt-3 mt-3 border-t border-slate-200">
            <div className="h-5 bg-slate-200 rounded w-32"></div>
          </div>
        </div>
      </div>
    );
  }

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    const statusMap: Record<string, string> = {
      active: "bg-green-100 text-green-800",
      draft: "bg-yellow-100 text-yellow-800",
      scheduled: "bg-slate-100 text-slate-800",
      completed: "bg-blue-100 text-blue-800",
      paused: "bg-red-100 text-red-800"
    };

    return statusMap[status.toLowerCase()] || "bg-slate-100 text-slate-800";
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-5 border-b flex justify-between items-center">
        <h3 className="font-medium text-slate-800">Digital Journey Status</h3>
        <Link href="/digital-journey" className="text-primary-600 text-sm font-medium hover:text-primary-700">
          View All
        </Link>
      </div>
      <div className="p-5 space-y-4">
        {journeys.length === 0 ? (
          <p className="text-sm text-slate-500">No journeys created yet</p>
        ) : (
          journeys.map((journey) => (
            <div key={journey.id} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-700">{journey.name}</p>
                <p className="text-xs text-slate-500">
                  {journey.steps} steps • {journey.emails} emails • {journey.tasks} {journey.tasks === 1 ? 'task' : 'tasks'}
                </p>
              </div>
              <span className={`${getStatusBadgeColor(journey.status)} text-xs px-2 py-1 rounded-full`}>
                {journey.status.charAt(0).toUpperCase() + journey.status.slice(1)}
              </span>
            </div>
          ))
        )}
        <div className="pt-3 mt-3 border-t border-slate-200">
          <Link href="/digital-journey/new" className="text-primary-600 hover:text-primary-800 text-sm font-medium flex items-center">
            <PlusCircle className="w-4 h-4 mr-1" />
            Create New Journey
          </Link>
        </div>
      </div>
    </div>
  );
}
