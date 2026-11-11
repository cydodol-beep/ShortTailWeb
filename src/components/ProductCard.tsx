import React from 'react';
import { Product, ProductVariant } from '../types';
import { getProductPriceDisplay, getProductStockRangeDisplay, getProductTotalStock } from '../lib/utils';
import { Plus, Minus, ShoppingBag, Layers, PackageCheck } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  quantityInCart: number;
  onAddToCart: (product: Product, variant?: ProductVariant) => void;
  onUpdateQuantity: (product: Product, delta: number) => void;
  onOpenDetail: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  quantityInCart,
  onAddToCart,
  onUpdateQuantity,
  onOpenDetail,
}) => {
  const hasVariants = Boolean(
    product.has_variants && product.variants && product.variants.length > 0
  );
  const totalStock = getProductTotalStock(product);
  const isOutOfStock = totalStock <= 0;
  const priceDisplay = getProductPriceDisplay(product);
  const stockDisplay = getProductStockRangeDisplay(product);

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-xl hover:border-slate-300 transition-all duration-200 flex flex-col justify-between overflow-hidden group border-b-4 border-b-emerald-500">
      <div>
        {/* Product Image Box */}
        <div
          onClick={() => onOpenDetail(product)}
          className="relative bg-slate-50 aspect-square w-full flex items-center justify-center p-4 cursor-pointer overflow-hidden border-b border-slate-100"
        >
          {product.main_image_url ? (
            <img
              src={product.main_image_url}
              alt={product.name}
              className="object-contain w-full h-full group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="text-slate-300 flex flex-col items-center justify-center">
              <PackageCheck className="w-12 h-12 stroke-[1.5]" />
            </div>
          )}

          {/* SKU / Stock Badge */}
          <div className="absolute top-3 left-3 flex flex-col gap-1 items-start">
            {product.sku && (
              <span className="px-2 py-0.5 bg-white/90 backdrop-blur-xs text-slate-800 rounded-md text-[10px] font-black tracking-tight shadow-2xs border border-slate-200/50">
                {product.sku}
              </span>
            )}
            {hasVariants && (
              <span className="bg-purple-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs flex items-center space-x-1">
                <Layers className="w-2.5 h-2.5 inline" />
                <span>{product.variants!.length} Varian</span>
              </span>
            )}
            {isOutOfStock ? (
              <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs">
                Stok Habis
              </span>
            ) : (
              <span className="bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-medium px-2 py-0.5 rounded-md shadow-xs">
                {stockDisplay}
              </span>
            )}
          </div>

          {/* Category Tag */}
          {product.category && (
            <div className="absolute bottom-3 right-3">
              <span className="bg-emerald-50 text-emerald-800 border border-emerald-200/80 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md">
                {product.category}
              </span>
            </div>
          )}
        </div>

        {/* Product Content */}
        <div className="p-4 space-y-1.5">
          <div
            onClick={() => onOpenDetail(product)}
            className="cursor-pointer group-hover:text-emerald-700 transition-colors"
          >
            <h3 className="font-bold text-slate-800 text-sm sm:text-base line-clamp-1">
              {product.name}
            </h3>
            {product.description && (
              <p className="text-xs text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">
                {product.description}
              </p>
            )}
          </div>

          {/* Unit Weight */}
          {product.unit_weight_grams ? (
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Berat: {product.unit_weight_grams}g
            </div>
          ) : null}
        </div>
      </div>

      {/* Price & Action Footer */}
      <div className="px-4 pb-4 pt-2 flex items-center justify-between border-t border-slate-100 gap-2 mt-auto">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Harga</span>
          <span className="text-xs sm:text-sm font-black text-emerald-600 block leading-tight">
            {priceDisplay}
          </span>
        </div>

        {/* Add to Cart / Qty Controls */}
        <div>
          {hasVariants ? (
            <button
              onClick={() => onOpenDetail(product)}
              disabled={isOutOfStock}
              className="flex items-center space-x-1.5 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white px-3 py-2 rounded-xl text-xs font-semibold shadow-xs shadow-purple-200 transition-all cursor-pointer disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Pilih Varian</span>
            </button>
          ) : quantityInCart > 0 ? (
            <div className="flex items-center space-x-1.5 bg-emerald-50 border border-emerald-200 rounded-xl p-1">
              <button
                onClick={() => onUpdateQuantity(product, -1)}
                className="w-7 h-7 bg-white hover:bg-emerald-100 text-emerald-800 rounded-lg flex items-center justify-center font-bold transition-colors cursor-pointer shadow-2xs"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-5 text-center font-bold text-xs text-emerald-900">
                {quantityInCart}
              </span>
              <button
                onClick={() => onUpdateQuantity(product, 1)}
                disabled={quantityInCart >= product.stock_quantity}
                className="w-7 h-7 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center justify-center font-bold transition-colors cursor-pointer shadow-2xs disabled:opacity-40"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => onAddToCart(product)}
              disabled={isOutOfStock}
              className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white px-3 py-2 rounded-xl text-xs font-semibold shadow-xs shadow-emerald-200 transition-all cursor-pointer disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>+ Keranjang</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
