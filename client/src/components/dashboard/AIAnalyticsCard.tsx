import { Link } from "wouter";

interface HealthScore {
  accountName: string;
  score: number;
}

interface WinProbability {
  dealName: string;
  accountName: string;
  probability: number;
}

interface AIAnalyticsCardProps {
  topHealthScores?: HealthScore[];
  accountsAtRisk?: HealthScore[];
  dealWinProbabilities?: WinProbability[];
  loading?: boolean;
}

export default function AIAnalyticsCard({
  topHealthScores = [],
  accountsAtRisk = [],
  dealWinProbabilities = [],
  loading = false,
}: AIAnalyticsCardProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-5 border-b">
          <h3 className="font-medium text-slate-800">AI Analytics</h3>
        </div>
        <div className="p-5 space-y-4 animate-pulse">
          <div>
            <div className="h-4 bg-slate-200 rounded w-32 mb-3"></div>
            <div className="space-y-2">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-slate-200 rounded-full mr-2"></div>
                    <div className="h-4 bg-slate-200 rounded w-24"></div>
                  </div>
                  <div className="flex items-center">
                    <div className="w-16 bg-slate-200 rounded-full h-1.5 mr-2"></div>
                    <div className="h-4 bg-slate-200 rounded w-8"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="pt-4 border-t border-slate-200">
            <div className="h-4 bg-slate-200 rounded w-32 mb-3"></div>
            <div className="space-y-2">
              {[...Array(2)].map((_, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-slate-200 rounded-full mr-2"></div>
                    <div className="h-4 bg-slate-200 rounded w-24"></div>
                  </div>
                  <div className="flex items-center">
                    <div className="w-16 bg-slate-200 rounded-full h-1.5 mr-2"></div>
                    <div className="h-4 bg-slate-200 rounded w-8"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="pt-4 border-t border-slate-200">
            <div className="h-4 bg-slate-200 rounded w-32 mb-3"></div>
            <div className="space-y-2">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-slate-200 rounded-full mr-2"></div>
                    <div className="h-4 bg-slate-200 rounded w-32"></div>
                  </div>
                  <div className="h-4 bg-slate-200 rounded w-8"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-5 border-b flex justify-between items-center">
        <h3 className="font-medium text-slate-800">AI Analytics</h3>
        <Link href="/ai-analytics">
          <a className="text-primary-600 text-sm font-medium hover:text-primary-700">
            View Details
          </a>
        </Link>
      </div>
      <div className="p-5 space-y-4">
        <div>
          <h4 className="text-sm font-medium text-slate-700 mb-2">Top Health Scores</h4>
          <div className="space-y-2">
            {topHealthScores.length === 0 ? (
              <p className="text-sm text-slate-500">No data available</p>
            ) : (
              topHealthScores.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-sm">{item.accountName}</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-16 bg-slate-200 rounded-full h-1.5 mr-2">
                      <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${item.score}%` }}></div>
                    </div>
                    <span className="text-sm font-medium">{item.score}%</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200">
          <h4 className="text-sm font-medium text-slate-700 mb-2">Accounts At Risk</h4>
          <div className="space-y-2">
            {accountsAtRisk.length === 0 ? (
              <p className="text-sm text-slate-500">No accounts at risk</p>
            ) : (
              accountsAtRisk.map((item, index) => {
                const color = item.score < 50 ? "red" : "yellow";
                return (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-2 h-2 bg-${color}-500 rounded-full mr-2`}></div>
                      <span className="text-sm">{item.accountName}</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-16 bg-slate-200 rounded-full h-1.5 mr-2">
                        <div className={`bg-${color}-500 h-1.5 rounded-full`} style={{ width: `${item.score}%` }}></div>
                      </div>
                      <span className="text-sm font-medium">{item.score}%</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200">
          <h4 className="text-sm font-medium text-slate-700 mb-2">Deal Win Probability</h4>
          <div className="space-y-2">
            {dealWinProbabilities.length === 0 ? (
              <p className="text-sm text-slate-500">No deal predictions available</p>
            ) : (
              dealWinProbabilities.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-primary-500 rounded-full mr-2"></div>
                    <span className="text-sm">{item.accountName} - {item.dealName}</span>
                  </div>
                  <span className="text-sm font-medium">{item.probability}%</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
