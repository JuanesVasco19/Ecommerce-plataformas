import { useState, type ChangeEvent, type FormEvent } from 'react';
import type { Product } from '@/types/product';
import { supabase } from '@/lib/supabase';

interface Props {
  product?: Product;
}

interface FormFields {
  name: string;
  description: string;
  price: string;
  category: string;
  stock: string;
  image_url: string;
}

interface FieldErrors {
  name?: string;
  price?: string;
  stock?: string;
  category?: string;
}

const CATEGORIES = ['Electrónica', 'Accesorios', 'Ropa', 'Hogar', 'Deportes', 'Otros'];

const formatPrice = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n);

function Field({
  label,
  required,
  error,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wide">
          {label}
          {required && <span className="text-rose-500 ml-0.5">*</span>}
        </label>
        {hint && !error && <span className="text-[11px] text-stone-400">{hint}</span>}
      </div>
      {children}
      {error && (
        <p className="text-xs text-rose-600 mt-1.5 flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}

const inputClass = (hasError?: boolean) =>
  `w-full px-3.5 py-2.5 rounded-xl border text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#9333ea]/30 transition-all ${
    hasError
      ? 'border-rose-300 bg-rose-50/50 focus:border-rose-500'
      : 'border-stone-200 bg-stone-50 focus:border-[#9333ea] focus:bg-white'
  }`;

export default function ProductForm({ product }: Props) {
  const isEditing = product !== undefined;

  const [fields, setFields] = useState<FormFields>({
    name: product?.name ?? '',
    description: product?.description ?? '',
    price: product?.price?.toString() ?? '',
    category: product?.category ?? '',
    stock: product?.stock?.toString() ?? '',
    image_url: product?.image_url ?? '',
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const isLoading = uploading || saving;

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFields((prev) => ({ ...prev, [name]: value }));
    if (name in fieldErrors) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name as keyof FieldErrors];
        return next;
      });
    }
  };

  const setImage = (file: File | null) => {
    setImageFile(file);
    setImagePreview(file ? URL.createObjectURL(file) : null);
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    setImage(e.target.files?.[0] ?? null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) setImage(file);
  };

  const validate = (): boolean => {
    const errors: FieldErrors = {};
    if (!fields.name.trim()) errors.name = 'El nombre es obligatorio.';
    if (!fields.category.trim()) errors.category = 'La categoría es obligatoria.';

    const price = parseFloat(fields.price);
    if (!fields.price || isNaN(price) || price <= 0) errors.price = 'Ingresa un precio mayor a 0.';

    const stock = parseInt(fields.stock, 10);
    if (fields.stock === '' || isNaN(stock) || stock < 0) errors.stock = 'El stock debe ser 0 o mayor.';

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const uploadImage = async (): Promise<string> => {
    if (!imageFile) return fields.image_url;
    setUploading(true);
    const ext = imageFile.name.split('.').pop() ?? 'jpg';
    const path = `${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from('products').upload(path, imageFile, { upsert: false });
    setUploading(false);
    if (uploadError) throw new Error(`Error al subir la imagen: ${uploadError.message}`);
    const { data } = supabase.storage.from('products').getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    setServerError(null);

    try {
      const image_url = await uploadImage();
      const payload = {
        name: fields.name.trim(),
        description: fields.description.trim(),
        price: parseFloat(fields.price),
        category: fields.category.trim(),
        stock: parseInt(fields.stock, 10),
        image_url,
      };

      if (isEditing) {
        const { error } = await supabase.from('products').update(payload).eq('id', product.id);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase.from('products').insert(payload);
        if (error) throw new Error(error.message);
      }

      window.location.href = '/admin';
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Error inesperado. Intenta de nuevo.');
      setSaving(false);
    }
  };

  const submitLabel = uploading
    ? 'Subiendo imagen...'
    : saving
      ? 'Guardando...'
      : isEditing
        ? 'Guardar cambios'
        : 'Crear producto';

  const currentImageSrc = imagePreview ?? (fields.image_url || null);
  const previewPrice = parseFloat(fields.price);
  const validPrice = !isNaN(previewPrice) && previewPrice > 0;

  return (
    <div>
      <div className="mb-8">
        <a href="/admin" className="inline-flex items-center gap-1.5 text-sm text-stone-600 hover:text-[#7e22ce] transition-colors mb-3">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Volver al panel
        </a>
        <p className="text-sm font-medium text-[#7e22ce]">{isEditing ? 'Edición' : 'Nuevo'}</p>
        <h1 className="font-display text-3xl font-bold tracking-tight text-stone-900 mt-1">
          {isEditing ? product.name : 'Crear producto'}
        </h1>
        <p className="mt-1 text-sm text-stone-500">
          {isEditing ? 'Actualiza la información del producto.' : 'Completa los campos para añadir un nuevo producto al catálogo.'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6 lg:p-7 space-y-5"
        >
          <Field label="Nombre" required error={fieldErrors.name}>
            <input
              name="name"
              type="text"
              value={fields.name}
              onChange={handleChange}
              disabled={isLoading}
              className={inputClass(!!fieldErrors.name)}
              placeholder="Ej: Auriculares inalámbricos premium"
            />
          </Field>

          <Field label="Descripción" hint={`${fields.description.length} caracteres`}>
            <textarea
              name="description"
              value={fields.description}
              onChange={handleChange}
              disabled={isLoading}
              rows={4}
              className={`${inputClass()} resize-none`}
              placeholder="Describe los detalles, materiales y beneficios del producto..."
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Precio (COP)" required error={fieldErrors.price}>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 text-sm">$</span>
                <input
                  name="price"
                  type="number"
                  min="0"
                  step="100"
                  value={fields.price}
                  onChange={handleChange}
                  disabled={isLoading}
                  className={`${inputClass(!!fieldErrors.price)} pl-7`}
                  placeholder="0"
                />
              </div>
            </Field>

            <Field label="Stock" required error={fieldErrors.stock}>
              <input
                name="stock"
                type="number"
                min="0"
                step="1"
                value={fields.stock}
                onChange={handleChange}
                disabled={isLoading}
                className={inputClass(!!fieldErrors.stock)}
                placeholder="0"
              />
            </Field>
          </div>

          <Field label="Categoría" required error={fieldErrors.category}>
            <div>
              <select
                name="category"
                value={fields.category}
                onChange={handleChange}
                disabled={isLoading}
                className={`${inputClass(!!fieldErrors.category)} appearance-none bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%20stroke%3D%22%2378716c%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%222%22%20d%3D%22M19%209l-7%207-7-7%22%2F%3E%3C/svg%3E')] bg-no-repeat bg-[length:18px] bg-[right_0.75rem_center] pr-10`}
              >
                <option value="">Selecciona una categoría</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {CATEGORIES.slice(0, 5).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setFields((p) => ({ ...p, category: c }))}
                    disabled={isLoading}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors ${
                      fields.category === c
                        ? 'bg-[#faf5ff] text-[#7e22ce] border-[#d8b4fe]'
                        : 'bg-white text-stone-600 border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </Field>

          <Field label="Imagen del producto" hint="PNG, JPG o WebP">
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              className={`relative rounded-xl border-2 border-dashed transition-colors ${
                dragging ? 'border-[#9333ea] bg-[#faf5ff]' : 'border-stone-300 bg-stone-50'
              }`}
            >
              {currentImageSrc ? (
                <div className="p-4 flex items-center gap-4">
                  <img
                    src={currentImageSrc}
                    alt="Vista previa"
                    className="w-24 h-24 rounded-xl object-cover ring-1 ring-stone-200 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-stone-900">
                      {imagePreview ? 'Nueva imagen lista' : 'Imagen actual'}
                    </p>
                    <p className="text-xs text-stone-500 mt-0.5">
                      {imagePreview ? 'Se subirá al guardar.' : 'Sube otra para reemplazarla.'}
                    </p>
                    <label className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-[#7e22ce] hover:text-[#581c87] cursor-pointer">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      Cambiar archivo
                      <input type="file" accept="image/*" onChange={handleImageChange} disabled={isLoading} className="sr-only" />
                    </label>
                  </div>
                </div>
              ) : (
                <label className="block p-8 text-center cursor-pointer">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white border border-stone-200 text-stone-500 mb-3">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-stone-700">
                    Arrastra una imagen o <span className="text-[#7e22ce]">selecciónala</span>
                  </p>
                  <p className="mt-1 text-xs text-stone-500">Recomendado 1:1 — al menos 600×600 px</p>
                  <input type="file" accept="image/*" onChange={handleImageChange} disabled={isLoading} className="sr-only" />
                </label>
              )}
            </div>
          </Field>

          {serverError && (
            <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl bg-rose-50 border border-rose-200">
              <svg className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z" />
              </svg>
              <p className="text-sm text-rose-700 leading-snug">{serverError}</p>
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row items-center gap-3 pt-2 border-t border-stone-100">
            <a
              href="/admin"
              className="w-full sm:w-auto px-5 py-2.5 text-sm font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors text-center"
            >
              Cancelar
            </a>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl gradient-brand text-white text-sm font-semibold shadow-glow hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0 transition-all"
            >
              {isLoading && (
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {submitLabel}
            </button>
          </div>
        </form>

        <aside className="lg:sticky lg:top-8 h-fit">
          <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">Vista previa en vivo</p>
          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
            <div className="aspect-square bg-stone-100 relative overflow-hidden">
              {currentImageSrc ? (
                <img src={currentImageSrc} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-stone-300">
                  <svg className="w-14 h-14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
              {fields.category && (
                <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-sm text-stone-800 text-[10px] font-semibold border border-white shadow-sm">
                  {fields.category}
                </span>
              )}
            </div>
            <div className="p-4">
              <p className="text-[10px] font-semibold text-[#7e22ce] uppercase tracking-wider">
                {fields.category || 'Categoría'}
              </p>
              <h3 className="mt-1 font-display font-semibold text-stone-900 text-sm leading-snug line-clamp-2 min-h-[2.5em]">
                {fields.name || 'Nombre del producto'}
              </h3>
              <div className="mt-3 flex items-center justify-between">
                <p className="font-display text-lg font-bold text-stone-900">
                  {validPrice ? formatPrice(previewPrice) : '—'}
                </p>
                <span className="text-[11px] text-stone-500">Stock: {fields.stock || '0'}</span>
              </div>
            </div>
          </div>
          <p className="mt-3 text-[11px] text-stone-500 leading-relaxed">
            Así se verá tu producto en el catálogo público.
          </p>
        </aside>
      </div>
    </div>
  );
}
