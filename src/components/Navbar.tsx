import React from 'react';
import { Customer, Category } from '../types';
import { ShoppingBag, Search, Store, User, X } from 'lucide-react';
import { formatDisplayPhone } from '../lib/utils';

interface NavbarProps {
  customer: Customer;
  categories: Category[];
  selectedCategoryId: string | null;
  onSelectCategory: (id: string | null) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  cartCount: number;
  onOpenCart: () => void;
  onChangeCustomer: () => void;
  storeLogo?: string | null;
  storeName?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  customer,
  categories,
  selectedCategoryId,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  cartCount,
  onOpenCart,
  onChangeCustomer,
  storeLogo,
  storeName = 'ShortTail Web Store',
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
      {/* Top Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-3">
          {/* Brand */}
          <div className="flex items-center space-x-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200/80 shadow-md flex items-center justify-center overflow-hidden shrink-0">
              {storeLogo ? (
                <img
                  src={storeLogo}
                  alt={storeName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-emerald-600 text-white flex items-center justify-center font-bold">
                  <Store className="w-5 h-5" />
                </div>
              )}
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">{storeName}</h1>
              <span className="text-[11px] text-emerald-700 font-medium">Self-Service Shop</span>
            </div>
          </div>

          {/* Active Customer Badge & Action Buttons */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Customer Badge */}
            <div className="hidden sm:flex items-center space-x-2 bg-slate-100 hover:bg-slate-200/80 px-3 py-1.5 rounded-xl border border-slate-200/80 transition-colors">
              <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                <User className="w-3.5 h-3.5" />
              </div>
              <div className="text-xs text-slate-700 leading-tight max-w-[160px] truncate">
                <div className="font-semibold text-slate-900 truncate">{customer.name}</div>
                <div className="text-[10px] text-slate-500">{formatDisplayPhone(customer.phone)}</div>
              </div>
              <button
                onClick={onChangeCustomer}
                className="text-[11px] text-emerald-700 hover:text-emerald-800 font-semibold underline ml-1 cursor-pointer"
                title="Ganti Pelanggan"
              >
                Ganti
              </button>
            </div>

            {/* Cart Button */}
            <button
              onClick={onOpenCart}
              className="relative flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white px-3.5 py-2 rounded-xl font-semibold text-xs shadow-md shadow-emerald-200 transition-all cursor-pointer shrink-0"
            >
              <ShoppingBag className="w-4.5 h-4.5" />
              <span className="hidden sm:inline">Keranjang</span>
              {cartCount > 0 && (
                <span className="bg-amber-400 text-slate-950 text-[11px] font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center shadow-xs">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Customer Badge */}
        <div className="sm:hidden mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded-lg">
          <div className="flex items-center space-x-1.5 truncate">
            <User className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="font-medium truncate">{customer.name} ({formatDisplayPhone(customer.phone)})</span>
          </div>
          <button
            onClick={onChangeCustomer}
            className="text-emerald-700 font-bold underline text-[11px] shrink-0 ml-2 cursor-pointer"
          >
            Ganti
          </button>
        </div>

        {/* Search Bar */}
        <div className="mt-3">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Cari nama produk, kategori, deskripsi..."
              className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Category Tabs Scrollbar */}
      <div className="border-t border-slate-100 bg-slate-50/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center space-x-2 overflow-x-auto py-2.5 scrollbar-none text-xs">
          <button
            onClick={() => onSelectCategory(null)}
            className={`px-3.5 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all cursor-pointer ${
              selectedCategoryId === null
                ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                : 'bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200'
            }`}
          >
            Semua Produk
          </button>

          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all cursor-pointer ${
                selectedCategoryId === cat.id
                  ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                  : 'bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};
