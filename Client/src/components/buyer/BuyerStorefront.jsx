import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  ShoppingBag, 
  Search, 
  Check, 
  Star, 
  Bot, 
  ArrowRight, 
  ShieldCheck,
  Laptop,
  Headphones,
  Smartphone,
  Camera,
  Layers
} from 'lucide-react';
import { productApi } from '../../services/api';

export default function BuyerStorefront({ openAiChat, policy, onAddToCart }) {
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState('All');
  const [loading, setLoading] = useState(false);

  const categories = ['All', 'Audio', 'Computing', 'Mobile', 'Smart', 'Travel', 'Cameras', 'Home & Lifestyle'];

  useEffect(() => {
    fetchProducts();
  }, [category]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = category !== 'All' ? { category } : {};
      const res = await productApi.getProducts(params);
      setProducts(res.data.products || []);
    } catch (err) {
      console.error('Failed to fetch storefront products:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      
      {/* Hero Banner */}
      <div className="relative rounded-2xl overflow-hidden bg-white p-6 sm:p-8 border border-slate-200 shadow-xs">
        <div className="max-w-2xl space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>AI-Native Autonomous Commerce</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
            Tell us what you're shopping for. <br />
            <span className="text-indigo-600">Autonomous AI Agents</span> handle discovery & payment.
          </h1>

          <p className="text-slate-600 text-xs sm:text-sm leading-relaxed font-medium">
            Describe your shopping needs naturally. Your AI Buyer Agent understands your requirements, coordinates with the Merchant Agent to discover suitable products, and evaluates proposals against your spending policies. Review your cart and approve payment securely through PayPal.
          </p>

          {/* Quick Demo Action Card */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={openAiChat}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-xs transition-all flex items-center space-x-2"
            >
              <Bot className="w-4 h-4 text-indigo-200" />
              <span>Launch AI Sales Agent</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Category Pills & Filter */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600" /> Product Categories
          </h2>
          <span className="text-xs text-slate-500 font-medium">
            Showing {products.length} catalog items
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                category === cat
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Product Catalog Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {products.map((item) => (
          <div key={item._id} className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col justify-between space-y-4 hover:border-indigo-200 hover:shadow-md transition-all shadow-xs">
            <div className="space-y-3">
              <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?q=80&w=800';
                  }}
                />
                <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-white/90 text-amber-700 backdrop-blur border border-slate-200 shadow-2xs flex items-center space-x-1">
                  <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                  <span>{item.rating || 4.8}</span>
                </span>
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs">
                  {item.category}
                </span>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 text-sm line-clamp-1">{item.title}</h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2 font-medium">{item.description}</p>
              </div>

              {/* Feature Highlights */}
              <div className="space-y-1 pt-1">
                {item.features?.slice(0, 2).map((feat, idx) => (
                  <div key={idx} className="flex items-center space-x-1.5 text-[11px] text-slate-600 font-medium">
                    <Check className="w-3 h-3 text-indigo-600 shrink-0" />
                    <span className="truncate">{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Price & Action */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
              <div>
                <div className="text-base font-black text-slate-900">₹{item.price.toLocaleString()}</div>
                <span className="text-[10px] text-slate-500 font-medium">In Stock ({item.stock})</span>
              </div>

              <button
                onClick={() => onAddToCart(item)}
                className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold transition-all flex items-center space-x-1.5 shadow-2xs"
              >
                <ShoppingBag className="w-3.5 h-3.5 text-slate-700" />
                <span>Add to Cart</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Floating Agent Launch Button */}
      <button
        onClick={openAiChat}
        className="fixed bottom-6 right-6 z-40 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-indigo-600/20 transition-all flex items-center space-x-2 border border-indigo-500/20"
      >
        <Bot className="w-4.5 h-4.5 text-indigo-200" />
        <span>Ask AI Sales Agent</span>
      </button>

    </div>
  );
}

