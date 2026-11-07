import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid,
} from 'recharts';
import { FundingAnalysis } from '../utils/fundingCalculator';
import { IndianRupee, Sparkles, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';

interface FundingGapChartProps {
  funding: FundingAnalysis;
}

export const FundingGapChart: React.FC<FundingGapChartProps> = ({ funding }) => {
  const {
    educationCost,
    confirmedFunding,
    netFundingRequirement,
    bestEligibleSum,
    projectedRemainingGap,
    coverageRatio,
    eligibleMatchesCount,
  } = funding;

  const chartData = [
    {
      name: 'Total Cost',
      amount: educationCost,
      color: '#475569',
      description: 'Annual college & living expenses',
    },
    {
      name: 'Confirmed',
      amount: confirmedFunding,
      color: '#27C995',
      description: 'Family funds & confirmed aid',
    },
    {
      name: 'Potential Aid',
      amount: bestEligibleSum,
      color: '#8065FF',
      description: `Top eligible matches (${eligibleMatchesCount} awards)`,
    },
    {
      name: 'Remaining Gap',
      amount: projectedRemainingGap,
      color: '#F59E0B',
      description: 'Projected net balance needed',
    },
  ];

  return (
    <div className="glass-card rounded-2xl p-5 border border-white/10 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#8065FF]/20 text-[#8065FF] border border-[#8065FF]/30">
              <TrendingUp className="w-4 h-4" />
            </span>
            <h3 className="font-heading text-base font-bold text-white">
              Funding Gap Intelligence
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time balance of education expenses vs confirmed and potential aid
          </p>
        </div>

        {/* Coverage pill */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 shrink-0">
          <Sparkles className="w-4 h-4 text-[#42D9F5]" />
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block uppercase tracking-wider">
              Projected Coverage
            </span>
            <span className="text-sm font-bold text-[#42D9F5]">{coverageRatio}%</span>
          </div>
        </div>
      </div>

      {/* Numerical Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 my-4">
        <div className="p-3 rounded-xl bg-[#080D1B]/80 border border-white/5">
          <span className="text-[11px] text-slate-400 block">Education Cost</span>
          <span className="text-sm font-bold text-white mt-0.5 block">
            ₹{educationCost.toLocaleString('en-IN')}
          </span>
          <span className="text-[10px] text-slate-500">Estimated Annual</span>
        </div>

        <div className="p-3 rounded-xl bg-[#27C995]/10 border border-[#27C995]/20">
          <span className="text-[11px] text-[#27C995] font-semibold block flex items-center gap-1">
            <CheckCircle className="w-3 h-3" /> Confirmed
          </span>
          <span className="text-sm font-bold text-white mt-0.5 block">
            ₹{confirmedFunding.toLocaleString('en-IN')}
          </span>
          <span className="text-[10px] text-emerald-400/80">Secured Funding</span>
        </div>

        <div className="p-3 rounded-xl bg-[#8065FF]/10 border border-[#8065FF]/20">
          <span className="text-[11px] text-violet-300 font-semibold block flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#42D9F5]" /> Potential Aid
          </span>
          <span className="text-sm font-bold text-white mt-0.5 block">
            ₹{bestEligibleSum.toLocaleString('en-IN')}
          </span>
          <span className="text-[10px] text-violet-300/80">Top Matched Grants</span>
        </div>

        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <span className="text-[11px] text-amber-400 font-semibold block flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> Remaining Gap
          </span>
          <span className="text-sm font-bold text-white mt-0.5 block">
            ₹{projectedRemainingGap.toLocaleString('en-IN')}
          </span>
          <span className="text-[10px] text-amber-400/80">Projected Balance</span>
        </div>
      </div>

      {/* Chart */}
      <div className="h-56 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 15, right: 10, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" vertical={false} />
            <XAxis
              dataKey="name"
              stroke="#94A3B8"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
            />
            <YAxis
              stroke="#94A3B8"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="glass-panel p-3 rounded-xl border border-white/10 text-xs shadow-xl">
                      <p className="font-bold text-white mb-0.5">{data.name}</p>
                      <p className="text-slate-400 text-[11px] mb-1">{data.description}</p>
                      <p className="font-heading font-bold text-sm text-[#42D9F5]">
                        ₹{data.amount.toLocaleString('en-IN')}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="pt-3 border-t border-white/5 text-[11px] text-slate-400 flex items-center justify-between">
        <span>* Rule: Potential scholarship funding is never counted as confirmed until awarded.</span>
        <span className="text-[#42D9F5] font-semibold">Net requirement: ₹{netFundingRequirement.toLocaleString('en-IN')}</span>
      </div>
    </div>
  );
};
