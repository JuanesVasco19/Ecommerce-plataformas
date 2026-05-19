import { useState, useEffect, useMemo } from 'react';
import type { Product } from '@/types/product';
import { supabase } from '@/lib/supabase';

type Toast = { id: number; type: 'success' | 'error'; message: string };

const formatPrice = (price: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(price);

function StatCard({
  label,
  value,
  hint,
  tone,
  icon,
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone: 'brand' | 'emerald' | 'amber' | 'rose';
  icon: string;
}) {
  const tones = {
    brand: 'from-[#9333ea]/10 to-[#d946ef]/5 text-[#7e22ce] border-[#e9d5ff]',
    emerald: 'from-emerald-100 to-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'from-amber-100 to-amber-50 text-amber-700 border-amber-200',
    rose: 'from-rose-100 to-rose-50 text-rose-700 border-rose-200',
  };
  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">{label}</p>
          <p className="mt-2 font-display text-3xl font-bold text-stone-900">{value}</p>
          {hint && <p className="mt-1 text-xs text-stone-500">{hint}</p>}
        </div>
        <div className={`inline-flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br border ${tones[tone]}`}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 bg-white rounded-xl border border-stone-200">
          <div className="skeleton w-12 h-12 rounded-xl shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-3 w-1/3" />
            <div className="skeleton h-3 w-1/5" />
          </div>
          <div className="skeleton h-8 w-20 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

function ConfirmDialog({
  product,
  loading,
  onCancel,
  onConfirm,
}: {
  product: Product;
  loading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fade-in"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-stone-200 p-6 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-rose-100 text-rose-600 shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="font-display text-lg font-bold text-stone-900">Eliminar producto</h3>
            <p className="mt-1 text-sm text-stone-600">
              ¿Eliminar <span className="font-semibold">"{product.name}"</span>? Esta acción no se puede deshacer.
            </p>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 rounded-lg text-sm font-medium text-stone-700 hover:bg-stone-100 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold shadow-sm disabled:opacity-50 transition-colors"
          >
            {loading ? 'Eliminando...' : 'Sí, eliminar'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ToastList({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border animate-toast-in min-w-[280px] ${
            t.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            {t.type === 'success' ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            )}
          </svg>
          <p className="text-sm font-medium flex-1">{t.message}</p>
          <button onClick={() => onDismiss(t.id)} className="text-current opacity-60 hover:opacity-100" aria-label="Cerrar">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}

export default function ProductsTable() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [confirming, setConfirming] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const pushToast = (type: Toast['type'], message: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  };

  const loadProducts = async () => {
    setLoading(true);
    setError(null);
    const { data, error: fetchError } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (fetchError) setError(fetchError.message);
    else setProducts(data ?? []);
    setLoading(false);
  };

  useEffect(() => { loadProducts(); }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter(
      (p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
    );
  }, [products, search]);

  const stats = useMemo(() => {
    const total = products.length;
    const outOfStock = products.filter((p) => p.stock === 0).length;
    const lowStock = products.filter((p) => p.stock > 0 && p.stock <= 5).length;
    const inventoryValue = products.reduce((sum, p) => sum + p.price * p.stock, 0);
    return { total, outOfStock, lowStock, inventoryValue };
  }, [products]);

  const handleDelete = async () => {
    if (!confirming) return;
    setDeleting(true);
    const { error: delError } = await supabase.from('products').delete().eq('id', confirming.id);
    setDeleting(false);

    if (delError) {
      pushToast('error', `Error al eliminar: ${delError.message}`);
      return;
    }
    pushToast('success', `"${confirming.name}" eliminado correctamente`);
    setConfirming(null);
    await loadProducts();
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <p className="text-sm font-medium text-[#7e22ce]">Panel</p>
          <h1 className="font-display text-3xl font-bold tracking-tight text-stone-900 mt-1">Productos</h1>
          <p className="mt-1 text-sm text-stone-500">Gestiona tu catálogo en tiempo real.</p>
        </div>
        <a
          href="/admin/productos/nuevo"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-brand text-white text-sm font-semibold shadow-glow hover:-translate-y-0.5 transition-all self-start sm:self-auto"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nuevo producto
        </a>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total productos"
          value={stats.total}
          tone="brand"
          icon="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
        />
        <StatCard
          label="Valor inventario"
          value={formatPrice(stats.inventoryValue)}
          hint="Suma de precio × stock"
          tone="emerald"
          icon="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
        <StatCard
          label="Stock bajo"
          value={stats.lowStock}
          hint="≤ 5 unidades"
          tone="amber"
          icon="M12 9v2m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z"
        />
        <StatCard
          label="Agotados"
          value={stats.outOfStock}
          tone="rose"
          icon="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728"
        />
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        <div className="p-4 border-b border-stone-100 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre o categoría..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-stone-200 bg-stone-50 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#9333ea]/30 focus:border-[#9333ea] focus:bg-white transition-all"
            />
          </div>
          <span className="text-xs text-stone-500">
            Mostrando <span className="font-semibold text-stone-700">{filtered.length}</span> de {products.length}
          </span>
        </div>

        {loading ? (
          <div className="p-4"><Skeleton /></div>
        ) : error ? (
          <div className="p-8 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-rose-100 text-rose-600 mb-3">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01" />
              </svg>
            </div>
            <p className="font-semibold text-stone-900">No pudimos cargar los productos</p>
            <p className="text-sm text-stone-500 mt-1">{error}</p>
            <button
              onClick={loadProducts}
              className="mt-4 px-4 py-2 rounded-lg bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 transition-colors"
            >
              Reintentar
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-stone-100 text-stone-400 mb-4">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <h3 className="font-display font-semibold text-stone-900">
              {search ? 'Sin coincidencias' : 'Aún no hay productos'}
            </h3>
            <p className="mt-1 text-sm text-stone-500">
              {search ? 'Prueba con otro término de búsqueda.' : 'Crea tu primer producto para empezar.'}
            </p>
            {!search && (
              <a
                href="/admin/productos/nuevo"
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg gradient-brand text-white text-sm font-semibold shadow-glow transition-all"
              >
                + Crear primer producto
              </a>
            )}
          </div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-100 bg-stone-50/60">
                    {['Producto', 'Categoría', 'Precio', 'Stock', ''].map((col) => (
                      <th key={col} className="px-5 py-3 text-left text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filtered.map((p) => (
                    <tr key={p.id} className="group hover:bg-stone-50/60 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          {p.image_url ? (
                            <img src={p.image_url} alt={p.name} className="w-11 h-11 rounded-xl object-cover bg-stone-100 ring-1 ring-stone-200" />
                          ) : (
                            <div className="w-11 h-11 rounded-xl bg-stone-100 flex items-center justify-center text-stone-400">
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01" />
                              </svg>
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-medium text-stone-900 truncate max-w-[280px]">{p.name}</p>
                            <p className="text-xs text-stone-500 font-mono">#{p.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className="px-2.5 py-1 text-[11px] rounded-full bg-[#faf5ff] text-[#7e22ce] border border-[#e9d5ff] font-medium">
                          {p.category}
                        </span>
                      </td>
                      <td className="px-5 py-3 font-medium text-stone-900 whitespace-nowrap">
                        {formatPrice(p.price)}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex w-2 h-2 rounded-full ${p.stock === 0 ? 'bg-rose-500' : p.stock <= 5 ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                          <span className={`text-sm ${p.stock === 0 ? 'text-rose-600 font-medium' : 'text-stone-700'}`}>
                            {p.stock}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1.5 justify-end">
                          <a
                            href={`/admin/productos/${p.id}/editar`}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 transition-colors"
                            aria-label="Editar"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Editar
                          </a>
                          <button
                            onClick={() => setConfirming(p)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 transition-colors"
                            aria-label="Eliminar"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a2 2 0 012-2h2a2 2 0 012 2v3" />
                            </svg>
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="md:hidden divide-y divide-stone-100">
              {filtered.map((p) => (
                <div key={p.id} className="p-4 flex items-start gap-3">
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.name} className="w-14 h-14 rounded-xl object-cover bg-stone-100 ring-1 ring-stone-200 shrink-0" />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-stone-100 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-stone-900 truncate">{p.name}</p>
                    </div>
                    <p className="text-xs text-stone-500 mt-0.5">
                      {p.category} · {formatPrice(p.price)} · stock {p.stock}
                    </p>
                    <div className="mt-2.5 flex items-center gap-1.5">
                      <a
                        href={`/admin/productos/${p.id}/editar`}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-stone-700 bg-stone-100"
                      >
                        Editar
                      </a>
                      <button
                        onClick={() => setConfirming(p)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-rose-700 bg-rose-50"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {confirming && (
        <ConfirmDialog
          product={confirming}
          loading={deleting}
          onCancel={() => !deleting && setConfirming(null)}
          onConfirm={handleDelete}
        />
      )}

      <ToastList toasts={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />
    </div>
  );
}
