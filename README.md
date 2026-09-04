# 🚛 Transporte Edan - Sistema de Control de Carga Pesada & Costos

Sistema integral para el control de flota de vehículos de carga pesada, seguimiento de gastos operativos por placa y cálculo de costos en tiempo real, conectado a **Supabase (PostgreSQL en la nube)** y desarrollado con **Next.js 15, React 19, TypeScript y Tailwind CSS**.

---

## ✨ Características Principales

* **Gestión de Vehículos por Placa:**
  * Registro de camiones, marca, modelo, año, chofer habitual asignado y kilometraje actual.
  * Estados operativos: *Activo (en ruta)*, *En Mantenimiento (taller)* e *Inactivo*.
  * Historial de costos individualizado por cada vehículo.

* **Registro de Gastos Operativos Categorizados:**
  * ⛽ **Combustible:** Control de litros cargados, precio por litro, costo total, estación de servicio y odómetro.
  * 🛞 **Cauchos / Neumáticos:** Cantidad, marca/medida, posición o eje (delantero, tracción posterior, batea, repuesto) y costo.
  * 👤 **Chofer & Viáticos:** Registro de viáticos de viaje, peajes, comidas, hospedaje, pagos y anticipos.
  * 🛢️ **Aceite & Lubricantes:** Tipo de aceite (15W40, sintético, etc.), filtros reemplazados y proyección del próximo cambio en kilómetros.
  * 🔧 **Mecánica & Taller:** Servicios preventivos y correctivos, repuestos instalados y costo de mano de obra.

* **Dashboard de Métricas y KPIs:**
  * Costo total acumulado (global y filtrable con 1 clic por vehículo).
  * Distribución porcentual interactiva del gasto.
  * Odómetro y kilometraje actualizado.
  * Sincronización instantánea con Supabase en la nube.

---

## 🚀 Puesta en Marcha Local

### 1. Requisitos Previos
* Node.js v18 o superior (v24 recomendado)
* Cuenta de Supabase

### 2. Instalación de Dependencias
```bash
npm install
```

### 3. Variables de Entorno
Crea un archivo `.env.local` con las credenciales de tu proyecto Supabase:
```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anonima-aqui
```

### 4. Ejecutar Servidor de Desarrollo
```bash
npm run dev
```
Abre en tu navegador [http://localhost:3000](http://localhost:3000).

---

## ☁️ Base de Datos en Supabase

El sistema utiliza dos tablas optimizadas con Row Level Security (RLS):
1. `transporte_vehiculos`
2. `transporte_gastos`

---

## 📦 Conectar con GitHub

Para subir el proyecto a tu repositorio de GitHub:

```bash
# 1. Iniciar git y rama main
git init -b main

# 2. Agregar cambios
git add .
git commit -m "feat: initial commit - Transporte Edan MVP"

# 3. Vincular repositorio remoto
git remote add origin https://github.com/edanworldgroup-prog/transporte-edan.git

# 4. Enviar a GitHub
git push -u origin main
```
