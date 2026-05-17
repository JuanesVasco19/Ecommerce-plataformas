# ecommerce-astro

Tienda en línea construida con Astro 6, React 19, Supabase y Tailwind CSS 4.
Desplegada en **Cloudflare Workers** (no Pages).

## Stack

| Herramienta | Versión | Rol |
|---|---|---|
| Astro | ^6.3.3 | Framework SSR/SSG |
| @astrojs/cloudflare | ^13.5.1 | Adaptador Workers |
| @supabase/supabase-js | ^2.105.4 | Base de datos y Auth |
| React | ^19.2.6 | Islas interactivas (admin) |
| Tailwind CSS | ^4.3.0 | Estilos |
| Wrangler | ^4.92.0 | CLI de Cloudflare |

---

## 1. Instalar dependencias

Requiere Node.js >= 22.12.0.

```bash
npm install
```

---

## 2. Configurar variables de entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-aqui
```

Consigue estos valores en el dashboard de Supabase:
**Project Settings → API → Project URL** y **anon public**.

> El prefijo `PUBLIC_` hace que Astro/Vite las exponga también en el cliente
> (necesario para los componentes React de isla que llaman a Supabase).

---

## 3. Correr en desarrollo

```bash
npm run dev
```

El servidor inicia en `http://localhost:4321`.

`platformProxy` está habilitado en el adaptador, así que `astro dev` emula
el runtime de Cloudflare Workers localmente (fetch, env vars, etc.).

---

## 4. Build de producción

```bash
npm run build
```

Genera la carpeta `dist/` con:
- Archivos estáticos (páginas con `prerender = true`, assets de Vite)
- El Worker compilado (entrypoint: `@astrojs/cloudflare/entrypoints/server`)

Para regenerar los tipos de Cloudflare después de modificar `wrangler.jsonc`:

```bash
npm run generate-types
```

---

## 5. Deploy a Cloudflare

### Primera vez

Asegúrate de estar autenticado en Wrangler:

```bash
npx wrangler login
```

Luego despliega:

```bash
npx wrangler deploy
```

Wrangler lee `wrangler.jsonc`, sube el Worker `ecommerce-astro` y sirve
los assets de `./dist` a través del binding `ASSETS`.

### Deploys posteriores

```bash
npm run build && npx wrangler deploy
```

---

## 6. Variables de entorno en Cloudflare

Las variables deben estar disponibles en el Worker desplegado.
Tienes dos opciones:

### Opción A — Dashboard (recomendado)

1. Abre [dash.cloudflare.com](https://dash.cloudflare.com)
2. Ve a **Workers & Pages → ecommerce-astro → Settings → Variables and Secrets**
3. Agrega:

| Variable | Tipo | Valor |
|---|---|---|
| `PUBLIC_SUPABASE_URL` | Variable de entorno (texto plano) | `https://tu-proyecto.supabase.co` |
| `PUBLIC_SUPABASE_ANON_KEY` | Variable de entorno (texto plano) | `tu-anon-key` |

Haz clic en **Deploy** para que el cambio entre en vigor.

### Opción B — Wrangler CLI (secrets cifrados)

```bash
npx wrangler secret put PUBLIC_SUPABASE_URL
npx wrangler secret put PUBLIC_SUPABASE_ANON_KEY
```

Wrangler pedirá el valor por stdin y lo subirá cifrado.
Los secrets no aparecen en texto plano en el dashboard ni en `wrangler.jsonc`.

> **Nota:** `PUBLIC_SUPABASE_ANON_KEY` es la clave anónima de Supabase (diseñada
> para ser pública y usarse en el cliente). No la confundas con la
> `service_role` key, que **nunca** debe exponerse en el frontend.

---

## Estructura del proyecto

```
src/
├── components/
│   ├── admin/
│   │   ├── AuthGuard.tsx       # Protege rutas admin (client-side)
│   │   ├── LoginForm.tsx       # Formulario de login con Supabase Auth
│   │   ├── ProductForm.tsx     # Crear / editar producto + subida de imagen
│   │   └── ProductsTable.tsx   # Tabla de productos con CRUD
│   └── ProductCard.astro       # Tarjeta de producto (tienda pública)
├── layouts/
│   ├── BaseLayout.astro        # Layout público (header + footer)
│   └── AdminLayout.astro       # Layout admin (sidebar + logout)
├── lib/
│   └── supabase.ts             # Cliente de Supabase (anon key)
├── pages/
│   ├── index.astro
│   ├── productos/
│   │   ├── index.astro
│   │   └── [id].astro
│   └── admin/
│       ├── index.astro         # prerender = true
│       ├── login.astro         # prerender = true
│       └── productos/
│           ├── nuevo.astro     # prerender = true
│           └── [id]/
│               └── editar.astro  # prerender = false (SSR, carga producto en servidor)
└── types/
    └── product.ts
```
