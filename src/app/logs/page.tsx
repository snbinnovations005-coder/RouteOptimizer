import { PrismaClient } from '@prisma/client';
import Link from 'next/link';

export const revalidate = 0; // Ensures it always fetches latest logs

const prisma = new PrismaClient();

const PRICING: Record<string, number> = {
  "Routes API": 0.005,
  "Dynamic Maps API": 0.007,
};

export default async function LogsPage() {
  const logs = await prisma.apiLog.findMany({
    orderBy: { createdAt: 'desc' }
  });

  const summary = logs.reduce((acc, log) => {
    if (!acc[log.apiName]) {
      acc[log.apiName] = { count: 0, cost: PRICING[log.apiName] || 0 };
    }
    acc[log.apiName].count += 1;
    return acc;
  }, {} as Record<string, { count: number; cost: number }>);

  let totalCost = 0;

  return (
    <div className="min-h-screen bg-gray-50 p-8 text-gray-900 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">API Usage & Cost Matrix</h1>
          <Link href="/" className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition font-medium">
            Back to Map
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-black/5 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">API Name</th>
                <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">Cost per Request</th>
                <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">Total Calls</th>
                <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">Total Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {Object.entries(summary).map(([apiName, data]) => {
                const rowCost = data.count * data.cost;
                totalCost += rowCost;
                return (
                  <tr key={apiName} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{apiName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">${data.cost.toFixed(3)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600 text-right">{data.count}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-red-500 text-right">${rowCost.toFixed(3)}</td>
                  </tr>
                );
              })}
              {Object.keys(summary).length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500 text-sm">No API logs found. Start using the map to track costs.</td>
                </tr>
              )}
            </tbody>
            <tfoot className="bg-gray-100">
              <tr>
                <th colSpan={3} scope="row" className="px-6 py-4 text-right text-sm font-extrabold text-gray-900 uppercase tracking-wider">Grand Total:</th>
                <td className="px-6 py-4 whitespace-nowrap text-right text-xl font-black text-gray-900">${totalCost.toFixed(3)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div>
          <h2 className="text-xl font-bold mb-4 tracking-tight text-gray-800">Detailed Request Log</h2>
          <div className="bg-white rounded-2xl shadow-sm ring-1 ring-black/5 overflow-hidden">
            <ul className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
              {logs.map((log) => (
                <li key={log.id} className="px-6 py-3 flex justify-between items-center text-sm hover:bg-gray-50 transition">
                  <span className="font-semibold text-gray-700 w-1/4">{log.apiName}</span>
                  <span className="text-gray-400 font-mono text-xs truncate w-1/2" title={log.endpoint}>{log.endpoint}</span>
                  <span className="text-gray-400 text-xs w-1/4 text-right">{new Date(log.createdAt).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
