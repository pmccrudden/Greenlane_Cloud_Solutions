import { AlertCircle, AlertTriangle, HelpCircle, Calendar, Mail, MessageSquare } from "lucide-react";
import { Link } from "wouter";
import { SupportTicket } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";

interface SupportTicketsCardProps {
  tickets: SupportTicket[];
  loading?: boolean;
}

export default function SupportTicketsCard({
  tickets,
  loading = false,
}: SupportTicketsCardProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-5 border-b flex justify-between items-center">
          <h3 className="font-medium text-slate-800">Recent Support Tickets</h3>
          <div className="h-4 w-16 bg-slate-200 rounded"></div>
        </div>
        <div className="divide-y divide-slate-200">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="p-4 animate-pulse">
              <div className="flex items-start">
                <div className="flex-shrink-0 h-10 w-10 bg-slate-200 rounded-full"></div>
                <div className="ml-3 flex-1">
                  <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                  <div className="flex justify-between">
                    <div className="h-3 bg-slate-200 rounded w-1/3"></div>
                    <div className="h-3 bg-slate-200 rounded w-16"></div>
                  </div>
                  <div className="mt-2 h-12 bg-slate-200 rounded"></div>
                  <div className="mt-2 flex items-center space-x-2">
                    <div className="h-5 bg-slate-200 rounded w-12"></div>
                    <div className="h-5 bg-slate-200 rounded w-12"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Get icon based on priority
  const getPriorityIcon = (priority: string) => {
    switch(priority.toLowerCase()) {
      case 'high':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'medium':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'low':
      default:
        return <HelpCircle className="w-5 h-5 text-green-600" />;
    }
  };

  // Get background color based on priority
  const getPriorityColor = (priority: string) => {
    switch(priority.toLowerCase()) {
      case 'high':
        return "bg-red-100";
      case 'medium':
        return "bg-yellow-100";
      case 'low':
      default:
        return "bg-green-100";
    }
  };

  // Get badge for priority
  const getPriorityBadge = (priority: string) => {
    switch(priority.toLowerCase()) {
      case 'high':
        return "bg-red-100 text-red-800";
      case 'medium':
        return "bg-yellow-100 text-yellow-800";
      case 'low':
      default:
        return "bg-green-100 text-green-800";
    }
  };

  // Get icon and badge for source
  const getSourceInfo = (source: string) => {
    switch(source.toLowerCase()) {
      case 'email':
        return {
          icon: <Mail className="w-4 h-4" />,
          badge: "bg-blue-100 text-blue-800"
        };
      case 'slack':
        return {
          icon: <MessageSquare className="w-4 h-4" />,
          badge: "bg-purple-100 text-purple-800"
        };
      case 'manual':
      default:
        return {
          icon: <Calendar className="w-4 h-4" />,
          badge: "bg-slate-100 text-slate-800"
        };
    }
  };

  // Format relative time
  const formatTime = (date: Date | string) => {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true });
    } catch (error) {
      return 'some time ago';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-5 border-b flex justify-between items-center">
        <h3 className="font-medium text-slate-800">Recent Support Tickets</h3>
        <Link href="/support-tickets">
          <a className="text-primary-600 text-sm font-medium hover:text-primary-700">
            View All
          </a>
        </Link>
      </div>
      <div className="divide-y divide-slate-200">
        {tickets.length === 0 ? (
          <div className="p-4 text-center text-sm text-slate-500">
            No support tickets found
          </div>
        ) : (
          tickets.map((ticket) => {
            const priorityIcon = getPriorityIcon(ticket.priority);
            const priorityColor = getPriorityColor(ticket.priority);
            const sourceInfo = getSourceInfo(ticket.source);
            
            return (
              <div key={ticket.id} className="p-4">
                <div className="flex items-start">
                  <div className={`flex-shrink-0 h-10 w-10 flex items-center justify-center ${priorityColor} rounded-full`}>
                    {priorityIcon}
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-slate-900">{ticket.subject}</p>
                    <div className="flex justify-between">
                      <p className="text-sm text-slate-500">{ticket.accountName} • {ticket.contactName}</p>
                      <p className="text-sm text-slate-500">{formatTime(ticket.createdAt)}</p>
                    </div>
                    <div className="mt-2 text-sm text-slate-700 line-clamp-2">
                      {ticket.description}
                    </div>
                    <div className="mt-2 flex items-center space-x-2">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityBadge(ticket.priority)}`}>
                        {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                      </span>
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${sourceInfo.badge}`}>
                        <span className="mr-1">{sourceInfo.icon}</span>
                        {ticket.source.charAt(0).toUpperCase() + ticket.source.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
