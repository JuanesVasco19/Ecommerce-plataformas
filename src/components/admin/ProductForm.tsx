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

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}

const inputClass = (hasError?: boolean) =>
  `w-full px-3 py-2 rounded-lg border text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition ${
    hasError ? 'border-red-400 bg-red-50' : 'border-gray-300'
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
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const isLoading = uploading || saving;

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setImageFile(file);
    if (file) {
      setImagePreview(URL.createObjectURL(file));
    } else {
      setImagePreview(null);
    }
  };

  const validate = (): boolean => {
    const errors: FieldErrors = {};

    if (!fields.name.trim()) errors.name = 'El nombre es obligatorio.';
    if (!fields.category.trim()) errors.category = 'La categoría es obligatoria.';

    const price = parseFloat(fields.price);
    if (!fields.price || isNaN(price) || price <= 0) {
      errors.price = 'Ingresa un precio mayor a 0.';
    }

    const stock = parseInt(fields.stock, 10);
    if (fields.stock === '' || isNaN(stock) || stock < 0) {
      errors.stock = 'El stock debe ser 0 o mayor.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const uploadImage = async (): Promise<string> => {
    if (!imageFile) return fields.image_url;

    setUploading(true);

    const ext = imageFile.name.split('.').pop() ?? 'jpg';
    const path = `${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('products')
      .upload(path, imageFile, { upsert: false });

    setUploading(false);

    if (uploadError) {
      throw new Error(`Error al subir la imagen: ${uploadError.message}`);
    }

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
        const { error } = await supabase
          .from('products')
          .update(payload)
          .eq('id', product.id);

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

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {isEditing ? `Editar: ${product.name}` : 'Nuevo producto'}
      </h1>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5"
      >
        <Field label="Nombre" required error={fieldErrors.name}>
          <input
            name="name"
            type="text"
            value={fields.name}
            onChange={handleChange}
            disabled={isLoading}
            className={inputClass(!!fieldErrors.name)}
            placeholder="Nombre del producto"
          />
        </Field>

        <Field label="Descripción">
          <textarea
            name="description"
            value={fields.description}
            onChange={handleChange}
            disabled={isLoading}
            rows={3}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition resize-none"
            placeholder="Descripción del producto"
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Precio (COP)" required error={fieldErrors.price}>
            <input
              name="price"
              type="number"
              min="0"
              step="100"
              value={fields.price}
              onChange={handleChange}
              disabled={isLoading}
              className={inputClass(!!fieldErrors.price)}
              placeholder="0"
            />
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
          <input
            name="category"
            type="text"
            value={fields.category}
            onChange={handleChange}
            disabled={isLoading}
            className={inputClass(!!fieldErrors.category)}
            placeholder="Ej: Electrónica, Ropa, Hogar..."
          />
        </Field>

        <Field label="Imagen del producto">
          {currentImageSrc && (
            <div className="mb-3 flex items-start gap-3">
              <img
                src={currentImageSrc}
                alt="Vista previa"
                className="w-24 h-24 rounded-lg object-cover border border-gray-200"
              />
              <p className="text-xs text-gray-500 mt-1">
                {imagePreview
                  ? 'Nueva imagen seleccionada.'
                  : 'Imagen actual. Sube una nueva para reemplazarla.'}
              </p>
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            disabled={isLoading}
            className="w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 file:transition-colors disabled:opacity-50"
          />
        </Field>

        {serverError && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3">
            <p className="text-sm text-red-700">{serverError}</p>
          </div>
        )}

        <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
          <button
            type="submit"
            disabled={isLoading}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            {submitLabel}
          </button>
          <a
            href="/admin"
            className="px-5 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancelar
          </a>
        </div>
      </form>
    </div>
  );
}
