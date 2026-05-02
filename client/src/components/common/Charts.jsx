import React from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import Card from "./Card";

const CHART_COLORS = ["#ff5a36", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444"];

export const SalesChart = ({ data = [] }) => (
  <Card>
    <h3 className="text-lg font-semibold text-slate-900 mb-4">Sales Trend</h3>
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#ff5a36" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#ff5a36" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="name" stroke="#94a3b8" />
        <YAxis stroke="#94a3b8" />
        <Tooltip
          contentStyle={{
            backgroundColor: "#1f2937",
            border: "none",
            borderRadius: "8px",
            color: "#fff",
          }}
        />
        <Area
          type="monotone"
          dataKey="sales"
          stroke="#ff5a36"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorSales)"
        />
      </AreaChart>
    </ResponsiveContainer>
  </Card>
);

/**
 * Bar Chart - For comparisons
 */
export const OrdersBarChart = ({ data = [] }) => (
  <Card>
    <h3 className="text-lg font-semibold text-slate-900 mb-4">
      Orders by Status
    </h3>
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="name" stroke="#94a3b8" />
        <YAxis stroke="#94a3b8" />
        <Tooltip
          contentStyle={{
            backgroundColor: "#1f2937",
            border: "none",
            borderRadius: "8px",
            color: "#fff",
          }}
        />
        <Bar dataKey="count" fill="#ff5a36" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  </Card>
);

/**
 * Pie Chart - For distribution
 */
export const FoodTypeDistribution = ({ data = [] }) => (
  <Card>
    <h3 className="text-lg font-semibold text-slate-900 mb-4">
      Food Type Distribution
    </h3>
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, value }) => `${name}: ${value}`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={CHART_COLORS[index % CHART_COLORS.length]}
            />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  </Card>
);

/**
 * Revenue Overview Chart
 */
export const RevenueChart = ({ data = [] }) => (
  <Card>
    <h3 className="text-lg font-semibold text-slate-900 mb-4">
      Revenue Overview
    </h3>
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="date" stroke="#94a3b8" />
        <YAxis stroke="#94a3b8" />
        <Tooltip
          contentStyle={{
            backgroundColor: "#1f2937",
            border: "none",
            borderRadius: "8px",
            color: "#fff",
          }}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="revenue"
          stroke="#ff5a36"
          strokeWidth={2}
          dot={{ fill: "#ff5a36", r: 4 }}
        />
        <Line
          type="monotone"
          dataKey="target"
          stroke="#cbd5e1"
          strokeWidth={2}
          strokeDasharray="5 5"
        />
      </LineChart>
    </ResponsiveContainer>
  </Card>
);

/**
 * Quick Stats Grid
 */
export const StatsGrid = ({ stats = [] }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    {stats.map((stat, index) => (
      <Card key={index} className="text-center">
        <div className="text-3xl font-black text-[#ff5a36]">{stat.value}</div>
        <p className="text-sm font-medium text-slate-600 mt-2">{stat.label}</p>
        {stat.trend && (
          <p
            className={`text-xs font-semibold mt-2 ${stat.trend > 0 ? "text-emerald-600" : "text-red-600"}`}
          >
            {stat.trend > 0 ? "↑" : "↓"} {Math.abs(stat.trend)}% from last
            period
          </p>
        )}
      </Card>
    ))}
  </div>
);

/**
 * Top Items List
 */
export const TopItemsList = ({ items = [] }) => (
  <Card>
    <h3 className="text-lg font-semibold text-slate-900 mb-4">
      Top Selling Items
    </h3>
    <div className="space-y-3">
      {items.map((item, index) => (
        <div
          key={index}
          className="flex items-center justify-between py-3 border-b border-slate-100 last:border-b-0"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-orange-100 to-orange-50 text-lg font-bold text-orange-600">
              #{index + 1}
            </div>
            <div>
              <p className="font-medium text-slate-900">{item.name}</p>
              <p className="text-xs text-slate-500">{item.sales} sold</p>
            </div>
          </div>
          <p className="font-semibold text-slate-900">
            PKR {item.revenue?.toLocaleString()}
          </p>
        </div>
      ))}
    </div>
  </Card>
);
