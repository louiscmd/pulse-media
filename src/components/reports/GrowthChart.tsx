'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  ReferenceDot,
} from 'recharts'
import { formatNumber } from '@/lib/utils'

interface DataPoint {
  date: string
  value: number
}

interface GrowthChartProps {
  title: string
  data: DataPoint[]
  currentValue: number
  delta?: number // percent change vs prior period
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-panel-2 border border-border-default rounded-xl px-3 py-2 text-[12.5px]">
      <p className="text-text-faint mb-1">{label}</p>
      <p className="text-text font-semibold">{formatNumber(payload[0].value, true)}</p>
    </div>
  )
}

export default function GrowthChart({ title, data, currentValue, delta }: GrowthChartProps) {
  const last = data[data.length - 1]

  return (
    <div className="bg-panel border border-border-default rounded-[24px] p-5">
      {/* Header */}
      <div className="flex items-start justify-between mb-1">
        <p className="text-[12.5px] font-semibold uppercase tracking-[0.06em] text-text-faint">
          {title}
        </p>
        {delta !== undefined && (
          <span className={`text-[12.5px] font-semibold ${delta >= 0 ? 'text-green' : 'text-red'}`}>
            {delta >= 0 ? '↑' : '↓'} {Math.abs(delta).toFixed(1)}%
          </span>
        )}
      </div>
      <p className="text-[30px] font-semibold text-text mb-4 leading-none">
        {formatNumber(currentValue, true)}
      </p>

      {/* Chart */}
      {data.length > 1 ? (
        <div style={{ height: 140 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id={`fill-${title}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1DD9C5" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#1DD9C5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="0"
                vertical={false}
                stroke="rgba(255,255,255,0.04)"
              />
              <XAxis
                dataKey="date"
                tick={{ fill: '#615e6d', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fill: '#615e6d', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => formatNumber(v, true)}
                width={48}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ stroke: 'rgba(29,217,197,0.3)', strokeWidth: 1, strokeDasharray: '4 2' }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#1DD9C5"
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
                fill={`url(#fill-${title})`}
                dot={false}
                activeDot={{
                  r: 4,
                  fill: '#1DD9C5',
                  stroke: '#0f0f13',
                  strokeWidth: 3,
                }}
              />
              {/* End-of-line marker */}
              {last && (
                <ReferenceDot
                  x={last.date}
                  y={last.value}
                  r={5}
                  fill="#1DD9C5"
                  stroke="#0f0f13"
                  strokeWidth={3}
                  label={{
                    value: formatNumber(last.value, true),
                    position: 'top',
                    fill: '#1DD9C5',
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-36 flex items-center justify-center">
          <p className="text-text-faint text-[13px]">Not enough data for this period.</p>
        </div>
      )}

      {/* Accessible data table (hidden visually, screen-reader accessible) */}
      <details className="mt-3">
        <summary className="text-[11px] text-text-faint cursor-pointer hover:text-text-dim">
          View data table
        </summary>
        <table className="mt-2 w-full text-[11.5px] text-text-dim">
          <thead>
            <tr className="border-b border-border-default">
              <th className="text-left py-1 font-medium text-text-faint">Date</th>
              <th className="text-right py-1 font-medium text-text-faint">Value</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.date} className="border-b border-border-default/50">
                <td className="py-1">{d.date}</td>
                <td className="py-1 text-right">{formatNumber(d.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  )
}
