import { Link } from "wouter";
import { Account } from "@/lib/types";

interface RecentAccountsTableProps {
  accounts: Account[];
  loading?: boolean;
}

export default function RecentAccountsTable({
  accounts,
  loading = false,
}: RecentAccountsTableProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-5 border-b flex justify-between items-center">
          <h3 className="font-medium text-slate-800">Recent Accounts</h3>
          <div className="h-4 w-16 bg-slate-200 rounded"></div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Account</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Health Score</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Parent Account</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {[...Array(3)].map((_, index) => (
                <tr key={index} className="animate-pulse">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-slate-200 rounded-full"></div>
                      <div className="ml-4">
                        <div className="h-4 bg-slate-200 rounded w-24 mb-2"></div>
                        <div className="h-3 bg-slate-200 rounded w-32"></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-16 bg-slate-200 rounded-full h-2.5"></div>
                      <div className="ml-2 h-4 bg-slate-200 rounded w-8"></div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="h-4 bg-slate-200 rounded w-24"></div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="h-5 bg-slate-200 rounded w-16"></div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-2">
                      <div className="h-4 bg-slate-200 rounded w-10"></div>
                      <div className="h-4 bg-slate-200 rounded w-10"></div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Calculate color based on health score
  const getHealthColor = (score: number | undefined) => {
    if (!score) return "bg-gray-500";
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  // Format status to badge
  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, string> = {
      active: "bg-green-100 text-green-800",
      inactive: "bg-slate-100 text-slate-800",
      "at risk": "bg-yellow-100 text-yellow-800",
      churned: "bg-red-100 text-red-800",
    };

    return statusMap[status.toLowerCase()] || "bg-slate-100 text-slate-800";
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-5 border-b flex justify-between items-center">
        <h3 className="font-medium text-slate-800">Recent Accounts</h3>
        <div 
          className="text-primary-600 text-sm font-medium hover:text-primary-700 cursor-pointer"
          onClick={() => window.location.href = '/accounts'}
        >
          View All
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Account</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Health Score</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Parent Account</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {accounts.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-sm text-slate-500">
                  No accounts found
                </td>
              </tr>
            ) : (
              accounts.map((account) => {
                // Generate initials for the avatar
                const initials = account.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .substring(0, 2)
                  .toUpperCase();
                
                // Get initial background color based on name
                const colors = [
                  "bg-primary-100 text-primary-700",
                  "bg-secondary-100 text-secondary-700",
                  "bg-accent-100 text-accent-700"
                ];
                const colorIndex = account.name.charCodeAt(0) % colors.length;
                const avatarClass = colors[colorIndex];

                return (
                  <tr key={account.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`flex-shrink-0 h-10 w-10 flex items-center justify-center ${avatarClass} rounded-full`}>
                          <span className="font-medium">{initials}</span>
                        </div>
                        <div className="ml-4">
                          <div 
                            className="text-sm font-medium text-slate-900 hover:text-primary-600 hover:underline cursor-pointer"
                            onClick={() => window.location.href = `/accounts/${account.id}`}
                          >
                            {account.name}
                          </div>
                          <div className="text-sm text-slate-500">
                            {account.industry} • {account.employeeCount ? `${account.employeeCount}+ employees` : 'Unknown size'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-16 bg-slate-200 rounded-full h-2.5">
                          <div className={`${getHealthColor(account.healthScore)} h-2.5 rounded-full`} style={{ width: `${account.healthScore || 0}%` }}></div>
                        </div>
                        <span className="ml-2 text-sm text-slate-700">{account.healthScore || '-'}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {account.parentAccountId ? 'Parent Account Name' : '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(account.status || 'active')}`}>
                        {account.status?.charAt(0).toUpperCase() + account.status?.slice(1) || 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      <div className="flex space-x-2">
                        <div 
                          className="text-primary-600 hover:text-primary-900 cursor-pointer"
                          onClick={() => window.location.href = `/accounts/${account.id}`}
                        >
                          View
                        </div>
                        <div 
                          className="text-primary-600 hover:text-primary-900 cursor-pointer"
                          onClick={() => window.location.href = `/accounts/${account.id}/edit`}
                        >
                          Edit
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
