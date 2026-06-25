import React, { useState } from 'react';
import AdminLayout from './AdminLayout';
import { FiImage, FiZap } from 'react-icons/fi';
import { BannerManager } from './AdminBanners';
import { OfferManager } from './AdminOffers';

const TABS = [
  { key: 'banners', label: 'Hero Banners',       icon: FiImage },
  { key: 'offers',  label: 'Limited Time Offers', icon: FiZap },
];

export default function AdminHomepageContent() {
  const [tab, setTab] = useState('banners');

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold text-[#111111]" style={{ fontFamily: 'Poppins, sans-serif' }}>Homepage Content</h1>
          <p className="text-[#666666] text-sm font-medium mt-1">Manage everything shown on the homepage from one place.</p>
        </div>

        <div className="flex border-b border-[#E5E5E5]">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-6 py-4 text-xs font-bold uppercase tracking-widest border-b-2 -mb-px transition-colors ${
                tab === key ? 'text-[#111111] border-[#111111]' : 'text-[#666666] border-transparent hover:text-[#111111]'
              }`}
            >
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>

        {tab === 'banners' ? <BannerManager /> : <OfferManager />}
      </div>
    </AdminLayout>
  );
}
