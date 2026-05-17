import { useState, useEffect } from 'react';
import type { Product } from '@/types/product';
import { supabase } from '@/lib/supabase';

const formatPrice = (price: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(price);

function Spinner({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 text-gray-500">
      <svg
        className="w-5 h-5 animate-spin text-indigo-600"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      <span className="text-sm">{label}</span>
    </div>
  );
}

function ImageCell({ src, alt }: { src: string; alt: string }) {
  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className="w-10 h-10 rounded-lg object-cover bg-gray-100"
      />
    );
  }
  return (
    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
      <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    </div>
  );
}

export default function ProductsTable() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadProducts = async () => {
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setProducts(data ?? []);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleDelete = async (product: Product) => {
    const confirmed = window.confirm(
      `¿Eliminar "${product.name}"? Esta acción no se puede deshacer.`
    );
    if (!confirmed) return;

    setDeletingId(product.id);

    const { error: deleteError } = await supabase
      .from('products')
      .delete()
      .eq('id', product.id);

    setDeletingId(null);

    if (deleteError) {
      alert(`Error al eliminar: ${deleteError.message}`);
      return;
    }

    await loadProducts();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner label="Cargando productos..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 p-5">
        <p className="text-sm font-medium text-red-700">Error al cargar los productos</p>
        <p className="text-sm text-red-600 mt-0.5">{error}</p>
        <button
          onClick={loadProducts}
          className="mt-3 text-sm text-red-700 underline hover:no-underline"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Productos</h1>
        <a
          href="/admin/productos/nuevo"
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          + Nuevo producto
        </a>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
          <p className="font-medium text-gray-600">No hay productos todavía.</p>
          <a
            href="/admin/productos/nuevo"
            className="text-sm text-indigo-600 hover:underline mt-1 block"
          >
            Crear el primero
          </a>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                {['Imagen', 'Nombre', 'Categoría', 'Precio', 'Stock', 'Acciones'].map((col) => (
                  <th
                    key={col}
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <ImageCell src={product.image_url} alt={product.name} />
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900 max-w-[200px] truncate">
                    {product.name}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 text-xs rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 font-medium">
                      {product.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                    {formatPrice(product.price)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={product.stock === 0 ? 'text-red-600 font-medium' : 'text-gray-700'}>
                      {product.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <a
                        href={`/admin/productos/${product.id}/editar`}
                        className="px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                      >
                        Editar
                      </a>
                      <button
                        onClick={() => handleDelete(product)}
                        disabled={deletingId === product.id}
                        className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 disabled:opacity-50 rounded-lg transition-colors"
                      >
                        {deletingId === product.id ? 'Eliminando...' : 'Eliminar'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
