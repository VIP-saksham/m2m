import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { TrendingUp, ArrowUpRight, ArrowDownRight, BarChart3 } from 'lucide-react';
import FarmerLayout from '../../layouts/FarmerLayout';
import Card from '../../components/ui/Card';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';
import { marketApi } from '../../services/api';

const crops = ['Tomato', 'Potato', 'Onion', 'Rice', 'Wheat', 'Cotton'];

const MarketIntelligence = () => {
  const [crop, setCrop] = useState('Tomato');
  const { data: prices, isLoading: pricesLoading } = useQuery({
    queryKey: ['marketPrices', crop],
    queryFn: () => marketApi.getPrices(crop),
  });
  const { data: trends, isLoading: trendsLoading } = useQuery({
    queryKey: ['marketTrends'],
    queryFn: marketApi.getTrends,
  });

  const history = prices?.history_7d || [];
  const maxPrice = Math.max(...history.map((item) => item.price), prices?.current_price || 0, 1);

  return (
    <FarmerLayout>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gold/15 text-gold"><TrendingUp size={28} /></div>
            <div><h1 className="text-2xl font-bold">Market Intelligence</h1><p className="text-charcoal/60">Use live signals to choose when and where to sell.</p></div>
          </div>
          <select value={crop} onChange={(e) => setCrop(e.target.value)} className="rounded-xl border border-cream-darker bg-white px-4 py-3">
            {crops.map((item) => <option key={item}>{item}</option>)}
          </select>
        </div>

        {pricesLoading ? <LoadingSkeleton count={2} /> : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <Card variant="green" className="lg:col-span-1"><Card.Body>
              <p className="text-white/70 text-sm">Current {crop} price</p>
              <p className="text-4xl font-bold mt-2">₹{prices?.current_price ?? '--'}</p>
              <p className="text-white/70 mt-1">per {prices?.unit || 'kg'}</p>
              <div className="mt-6 flex items-center gap-2 text-leaf-light"><ArrowUpRight size={18} /> {prices?.change_percent ?? 0}% this week</div>
            </Card.Body></Card>
            <Card className="lg:col-span-2"><Card.Header><h2 className="font-semibold flex items-center gap-2"><BarChart3 size={18} className="text-leaf" /> 7-day price movement</h2></Card.Header><Card.Body>
              <div className="h-44 flex items-end gap-2">
                {history.map((item) => <div key={item.date} className="flex-1 flex flex-col items-center gap-2"><span className="text-xs text-charcoal/60">₹{item.price}</span><div className="w-full max-w-12 bg-leaf rounded-t-lg" style={{ height: `${Math.max(12, (item.price / maxPrice) * 100)}%` }} /><span className="text-[10px] text-charcoal/50">{item.date.replace('Day-', 'D')}</span></div>)}
              </div>
            </Card.Body></Card>
          </div>
        )}

        <Card><Card.Header><h2 className="font-semibold">Crop outlook</h2></Card.Header><Card.Body>
          {trendsLoading ? <LoadingSkeleton count={2} /> : <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {(trends?.trends || []).map((item) => <div key={item.crop} className="p-4 rounded-xl bg-cream flex items-center justify-between"><div><p className="font-semibold">{item.crop}</p><p className="text-xs text-charcoal/55">{item.demand_quantity.toLocaleString()} kg demand</p></div><div className={`text-sm font-semibold ${item.price_movement >= 0 ? 'text-leaf' : 'text-red-500'}`}>{item.price_movement >= 0 ? <ArrowUpRight className="inline" size={16} /> : <ArrowDownRight className="inline" size={16} />}{Math.abs(item.price_movement)}%</div></div>)}
          </div>}
        </Card.Body></Card>
      </motion.div>
    </FarmerLayout>
  );
};

export default MarketIntelligence;
