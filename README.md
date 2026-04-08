# Abel Bou — ClientFlow 🌿

Aplicación web privada de gestión de clientes, proyectos, facturas y tickets fiscales.

---

## 🚀 Instalación rápida

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar Supabase
```bash
cp .env.example .env
```
Edita `.env` con tus credenciales de Supabase:
```
VITE_SUPABASE_URL=https://TU_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=TU_ANON_KEY
```

### 3. Crear las tablas en Supabase
- Ve a tu proyecto en [supabase.com](https://supabase.com)
- Abre **SQL Editor → New Query**
- Pega y ejecuta el contenido de `supabase_setup.sql`
- Ve a **Storage → New Bucket** → nombre: `tickets`, privado (no público)

### 4. Arrancar
```bash
npm run dev
```
Abre [http://localhost:5173](http://localhost:5173)

---

## 🔐 Credenciales por defecto

```
Email:      abel@abelbou.com
Contraseña: abelbou2024
```
**Cámbialas en Ajustes nada más entrar.**

---

## 📋 Funcionalidades

### Clientes
- Nombre, email, teléfono, NIF, dirección
- Marca si es **empresa/autónomo** → activa IRPF automáticamente en facturas Serie D

### Proyectos / Servicios
- **Por hora**: precio/hora, horas estimadas, **timer de sesiones** con tabla detallada (fecha, inicio, fin, minutos)
- **Precio cerrado**: importe fijo
- El tipo de facturación se define **en el proyecto**, no en el cliente
- Barra de progreso de horas trabajadas vs estimadas

### Facturas
- **Serie D** (`001D`, `002D`…) → Servicios Digitales → IVA 21% + IRPF 7% (solo a empresas/autónomos)
- **Serie P** (`001P`, `002P`…) → Productos → solo IVA 21%, sin IRPF
- Numeración correlativa automática por serie
- Descarga en **PDF** con tu logo y datos fiscales
- Estados: Borrador → Enviada → Pagada

### Tickets y Gastos
- Sube fotos (JPG, PNG) o PDFs de tickets
- Calcula automáticamente el **IVA deducible**
- Los archivos se guardan en Supabase Storage (no se pierden nunca)

### Dashboard fiscal
- IVA repercutido (facturas emitidas)
- IVA soportado (tickets de gastos)
- **IVA a pagar** = repercutido − soportado
- IRPF retenido total
- Líquido para ti

---

## 🗄️ Supabase — Guía detallada

### Crear cuenta y proyecto
1. Ve a [supabase.com](https://supabase.com) → Start for free
2. Regístrate con GitHub o email
3. **New project** → nombre: `abelbou`, región: **West EU (Ireland)**
4. Anota la contraseña de la BD (la necesitarás si usas Supabase CLI)
5. Espera ~2 min a que se inicialice

### Obtener credenciales
- ⚙️ Settings → API
- Copia **Project URL** y **anon public key**
- Pégalos en el archivo `.env`

### Crear storage bucket
- Storage (icono cubo) → New Bucket
- Nombre: `tickets`
- Desactiva "Public bucket"
- Guarda

---

## 📤 Subir a GitHub (privado)

```bash
git init
git add .
git commit -m "feat: Abel Bou ClientFlow v2"

# Crea repo PRIVADO en github.com, luego:
git remote add origin https://github.com/TU_USUARIO/abelbou-clientflow.git
git branch -M main
git push -u origin main
```

---

## 🌐 Deploy en Vercel (gratis)

1. Ve a [vercel.com](https://vercel.com) → Import Git Repository
2. Importa tu repo (puede ser privado)
3. En **Environment Variables** añade:
   - `VITE_SUPABASE_URL` → tu URL de Supabase
   - `VITE_SUPABASE_ANON_KEY` → tu anon key
4. Deploy → tu app estará en `https://abelbou-xxx.vercel.app`

---

## 🗂️ Estructura del proyecto

```
src/
├── context/
│   └── AuthContext.jsx        # Login con email/contraseña
├── hooks/
│   ├── useData.js             # Clientes, proyectos, sesiones timer
│   ├── useInvoices.js         # Facturas Serie D/P con IRPF
│   └── useTickets.js          # Tickets con subida a Supabase Storage
├── pages/
│   ├── Login.jsx
│   ├── Dashboard.jsx          # Resumen fiscal (IVA, IRPF, líquido)
│   ├── Clients.jsx
│   ├── ClientDetail.jsx
│   ├── Projects.jsx           # Timer con tabla de sesiones
│   ├── Invoices.jsx           # Serie D / Serie P
│   ├── Tickets.jsx            # Subida de fotos y PDFs
│   └── Settings.jsx           # Datos fiscales
├── components/
│   ├── Layout.jsx             # Sidebar con logo Abel Bou
│   ├── UI.jsx / UI.module.css # Componentes reutilizables
│   ├── ClientModal.jsx
│   ├── ProjectModal.jsx
│   ├── InvoiceModal.jsx
│   └── InvoiceViewModal.jsx
└── utils/
    ├── supabase.js            # Cliente Supabase
    ├── helpers.js             # Formato moneda, fechas, horas
    └── pdfGenerator.js        # PDF con jsPDF (logo Abel Bou)

supabase_setup.sql             # SQL para crear todas las tablas
.env.example                   # Plantilla de variables de entorno
```
