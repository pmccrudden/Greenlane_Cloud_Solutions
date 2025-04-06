import { Link } from "wouter";
import { Deal } from "@/lib/types";
import { format } from "date-fns";

interface OpenDealsTableProps {
  deals: Deal[];
  loading?: boolean;
}

export default function OpenDealsTable({
  deals,
  loading = false,
}: OpenDealsTableProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-5 border-b flex justify-between items-center">
          <h3 className="font-medium text-slate-800">Open Deals</h3>
          <div className="h-4 w-16 bg-slate-200 rounded"></div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Deal</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Account</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Value</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Stage</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Closing Date</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {[...Array(3)].map((_, index) => (
                <tr key={index} className="animate-pulse">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="h-4 bg-slate-200 rounded w-32"></div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="h-4 bg-slate-200 rounded w-24"></div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="h-4 bg-slate-200 rounded w-16"></div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="h-5 bg-slate-200 rounded w-20"></div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="h-4 bg-slate-200 rounded w-24"></div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Format stage to badge
  const getStageBadge = (stage: string) => {
    const stageMap: Record<string, string> = {
      prospecting: "bg-slate-100 text-slate-800",
      qualification: "bg-slate-100 text-slate-800",
      needs_analysis: "bg-blue-100 text-blue-800",
      value_proposition: "bg-blue-100 text-blue-800",
      proposal: "bg-purple-100 text-purple-800",
      negotiation: "bg-blue-100 text-blue-800",
      closing: "bg-green-100 text-green-800",
      closed_won: "bg-green-100 text-green-800",
      closed_lost: "bg-red-100 text-red-800",
    };

    return stageMap[stage.toLowerCase().replace(/ /g, '_')] || "bg-slate-100 text-slate-800";
  };

  // Format currency
  const formatCurrency = (value: number | undefined) => {
    if (value === undefined) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Format date
  const formatDate = (date: Date | string | undefined) => {
    if (!date) return '-';
    try {
      return format(new Date(date), 'MMM dd, yyyy');
    } catch (error) {
      return '-';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-5 border-b flex justify-between items-center">
        <h3 className="font-medium text-slate-800">Open Deals</h3>
        <Link href="/deals">
          <a className="text-primary-600 text-sm font-medium hover:text-primary-700">
            View All
          </a>
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Deal</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Account</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Value</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Stage</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Closing Date</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {deals.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-sm text-slate-500">
                  No open deals found
                </td>
              </tr>
            ) : (
              deals.map((deal) => (
                <tr key={deal.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-slate-900">{deal.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-slate-900">
                      {deal.accountName}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                    {formatCurrency(deal.value)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStageBadge(deal.stage || 'prospecting')}`}>
                      {deal.stage?.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') || 'Prospecting'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {formatDate(deal.closeDate)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
