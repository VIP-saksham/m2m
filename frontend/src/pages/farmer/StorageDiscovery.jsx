import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Warehouse, MapPin, Star, Truck, ShieldCheck, Search } from 'lucide-react';
import FarmerLayout from '../../layouts/FarmerLayout';
import Card from '../../components/ui/Card';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';
import { storageApi } from '../../services/api';

const StorageDiscovery = () => {
  const [location, setLocation] = useState('');
  const [crop, setCrop] = useState('');
  const { data: providers = [], isLoading, isError } = useQuery({
    queryKey: ['storageProviders', location, crop],
    queryFn: () => storageApi.getAll({ location: location || undefined, crop: crop || undefined }),
  });

  return (
    <FarmerLayout>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1 }} className="space-y-6">
        <div className="flex items-center gap-3"><div className="p-3 rounded-2xl bg-blue-100 text-blue-700"><Warehouse size={28} /></div><div><h1 className="text-2xl font-bold">Storage Discovery</h1><p className="text-charcoal/60">Find trusted storage near your harvest.</p></div></div>
        <Card><Card.Body className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative"><Search size={17} className="absolute left-3 top-3.5 text-charcoal/40" /><input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Search location" className="w-full rounded-xl border border-cream-darker pl-10 pr-3 py-3" /></div>
          <select value={crop} onChange={(e) => setCrop(e.target.value)} className="rounded-xl border border-cream-darker px-3 py-3"><option value="">All crops</option><option>Tomato</option><option>Potato</option><option>Onion</option><option>Rice</option><option>Wheat</option></select>
          <div className="rounded-xl bg-cream px-4 py-3 text-sm text-charcoal/70 flex items-center"><MapPin size={17} className="mr-2 text-leaf" /> Showing nearby providers</div>
        </Card.Body></Card>
        {isLoading && <LoadingSkeleton count={3} />}
        {isError && <div className="p-4 rounded-2xl bg-red-50 text-red-700">Unable to load storage providers. Please try again.</div>}
        {!isLoading && !isError && <div className="grid grid-cols-1 md:grid-cols-2 gap-5">{providers.map((provider) => <Card key={provider.id} hover><Card.Body>
          <div className="flex justify-between gap-4"><div><h2 className="text-lg font-bold">{provider.name}</h2><p className="text-sm text-charcoal/60 flex items-center gap-1 mt-1"><MapPin size={14} /> {provider.location}, {provider.state} · {provider.distance_km} km</p></div><div className="flex items-center gap-1 text-gold"><Star size={16} fill="currentColor" /> {provider.rating}</div></div>
          <div className="grid grid-cols-2 gap-3 my-5 text-sm"><div className="rounded-xl bg-cream p-3"><span className="block text-charcoal/50">Available capacity</span><strong>{provider.capacity_available.toLocaleString()} kg</strong></div><div className="rounded-xl bg-cream p-3"><span className="block text-charcoal/50">Starting from</span><strong>₹{provider.price_per_unit_per_day}/kg/day</strong></div></div>
          <div className="flex flex-wrap gap-2 text-xs text-charcoal/65">{provider.has_transport && <span className="flex items-center gap-1 bg-leaf/10 text-leaf px-2 py-1 rounded-full"><Truck size={13} /> Transport</span>}{provider.has_insurance && <span className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded-full"><ShieldCheck size={13} /> Insured</span>}<span className="bg-cream px-2 py-1 rounded-full">{provider.min_duration_days}-{provider.max_duration_days} days</span></div>
          <a href={`tel:${provider.contact_phone}`} className="block text-center mt-5 rounded-xl bg-forest text-white py-2.5 hover:bg-forest-dark transition">Contact provider</a>
        </Card.Body></Card>)}</div>}
      </motion.div>
    </FarmerLayout>
  );
};

export default StorageDiscovery;
