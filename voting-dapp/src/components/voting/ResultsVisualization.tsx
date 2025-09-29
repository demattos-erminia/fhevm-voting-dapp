"use client";

import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface ResultsVisualizationProps {
  results: number[];
  options: string[];
  totalVotes: number;
  isRevealed: boolean;
}

const COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042',
  '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c',
  '#8dd1e1', '#d084d0'
];

export const ResultsVisualization = ({
  results,
  options,
  totalVotes,
  isRevealed
}: ResultsVisualizationProps) => {
  const chartData = useMemo(() => {
    if (!isRevealed || !results.length) return [];

    return options.map((option, index) => ({
      name: option.length > 20 ? option.substring(0, 20) + '...' : option,
      fullName: option,
      value: results[index] || 0,
      percentage: totalVotes > 0 ? ((results[index] || 0) / totalVotes * 100).toFixed(1) : '0',
      color: COLORS[index % COLORS.length]
    }));
  }, [results, options, totalVotes, isRevealed]);

  const winner = useMemo(() => {
    if (!chartData.length) return null;
    return chartData.reduce((prev, current) =>
      current.value > prev.value ? current : prev
    );
  }, [chartData]);

  if (!isRevealed) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <div className="text-4xl mb-4">🔒</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Results Not Yet Available
            </h3>
            <p className="text-gray-600">
              Voting results will be revealed after the voting period ends and
              the minimum vote threshold is met.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!results.length || totalVotes === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Votes Cast
            </h3>
            <p className="text-gray-600">
              This proposal received no votes during the voting period.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Voting Results Summary</CardTitle>
          <CardDescription>
            Total votes cast: {totalVotes}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{totalVotes}</div>
              <div className="text-sm text-blue-800">Total Votes</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{options.length}</div>
              <div className="text-sm text-green-800">Options</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {winner ? winner.percentage : '0'}%
              </div>
              <div className="text-sm text-purple-800">Leading Option</div>
            </div>
          </div>

          {winner && (
            <div className="text-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="text-lg font-semibold text-yellow-900 mb-1">
                🏆 Winner: {winner.fullName}
              </div>
              <div className="text-sm text-yellow-700">
                {winner.value} votes ({winner.percentage}%)
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Vote Distribution</CardTitle>
            <CardDescription>Percentage breakdown of votes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name}: ${percentage}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      `${value} votes`,
                      name
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Vote Count</CardTitle>
            <CardDescription>Absolute number of votes per option</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    fontSize={12}
                  />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number) => [`${value} votes`, 'Votes']}
                    labelFormatter={(label) => `Option: ${label}`}
                  />
                  <Bar dataKey="value" fill="#8884d8">
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Results Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Results</CardTitle>
          <CardDescription>Complete breakdown of voting results</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {chartData
              .sort((a, b) => b.value - a.value)
              .map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <div>
                      <div className="font-medium text-gray-900">{item.fullName}</div>
                      <div className="text-sm text-gray-600">
                        {item.value} votes • {item.percentage}%
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-gray-900">
                      {item.value}
                    </div>
                    <div className="text-sm text-gray-600">
                      {item.percentage}%
                    </div>
                  </div>
                  <div className="flex-1 ml-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${totalVotes > 0 ? (item.value / totalVotes * 100) : 0}%`,
                          backgroundColor: item.color
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
