# LexGT - Plataforma de Búsqueda Legal para Guatemala

Búsqueda de jurisprudencia, leyes, decretos y más. Todo en un solo lugar.

## Requisitos

- Node.js 18 o superior
- Cuenta en Supabase (gratuita)

## Instalación

1. Clona el repositorio:
```bash
git clone https://github.com/tu-usuario/lexgt.git
cd lexgt
```

2. Instala las dependencias:
```bash
npm install
```

3. Configura las variables de entorno:
```bash
cp .env.example .env.local
```
Edita `.env.local` con tus credenciales de Supabase.

4. Ejecuta el esquema SQL en Supabase:
   - Ve a tu proyecto en supabase.com
   - Abre SQL Editor
   - Pega el contenido de `supabase/schema.sql`
   - Haz clic en Run

5. Inicia el servidor de desarrollo:
```bash
npm run dev
```

## Estructura del Proyecto

```
lexgt/
├── public/              # Archivos estáticos
├── src/
│   ├── components/      # Componentes reutilizables
│   │   ├── Header.jsx
│   │   ├── Footer.jsx
│   │   ├── SearchBar.jsx
│   │   └── ResultCard.jsx
│   ├── lib/             # Configuración y utilidades
│   │   ├── supabase.js  # Cliente de Supabase
│   │   └── api.js       # Funciones de búsqueda
│   ├── pages/           # Páginas principales
│   │   ├── HomePage.jsx
│   │   ├── DocumentPage.jsx
│   │   └── AboutPage.jsx
│   ├── styles/
│   │   └── global.css
│   ├── App.jsx
│   └── main.jsx
├── supabase/
│   └── schema.sql       # Esquema de base de datos
├── .env.example
├── package.json
└── vite.config.js
```

## Despliegue en Vercel

1. Sube el proyecto a GitHub
2. Ve a vercel.com y conecta tu repositorio
3. Agrega las variables de entorno (VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY)
4. Haz clic en Deploy

## Fases del Proyecto

- **Fase 1**: Recopilación de datos (scrapers)
- **Fase 2**: Búsqueda por palabras clave (actual)
- **Fase 3**: IA con Claude (búsqueda semántica + interpretación)
- **Fase 4**: Cuentas de usuario y monetización

## Licencia

Privado - A2J Tech
