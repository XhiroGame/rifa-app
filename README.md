# 🎟️ Sistema de Gestión de Rifa Anual (12 Meses • $100.000 COP/mes)

Aplicación web desarrollada en **Next.js** con **Tailwind CSS** diseñada especialmente para el modelo de **Rifa Anual por Cuotas Mensuales** (12 mensualidades de **$100.000 COP** cada una, del **000 al 999**). Incluye integración con **Google Sheets**, análisis inteligente de comprobantes con **Gemini AI**, almacenamiento en **Google Drive** y **Panel de Administración** con control de morosos y aprobaciones.

---

## 📅 Modelo de Negocio: Rifa Anual (12 Cuotas)

- **Duración**: 1 Año (12 mensualidades: Enero a Diciembre).
- **Valor mensual**: **$100.000 COP** por boleta.
- **Valor total anual por número**: **$1.200.000 COP** ($100.000 x 12).
- **Dinámica del participante**:
  - **Apartado inicial**: El participante reserva su número de la suerte (ej: `#023`) cancelando la **Cuota 1** y subiendo el comprobante.
  - **Abonos mensuales**: Cada mes puede ingresar a la web, hacer clic en su número y presionar **"Pagar Cuota [Mes]"** para adjuntar su nuevo comprobante de transferencia.
- **Estados del número en la cuadrícula**:
  - 🟢 **Disponible**: Número libre para apartar con la cuota inicial.
  - 🔵 **Al día**: Participante que va al corriente con sus mensualidades.
  - 🟡 **En mora**: Participante que debe mensualidades vencidas (botón para cobrar por WhatsApp).
  - 🟣 **En revisión**: Tiene una cuota recién pagada esperando aprobación del administrador.
  - 🏆 **Completada (12/12)**: Ha cancelado la totalidad del año ($1.200.000 COP).

---

## 📊 Estructura de la Hoja de Google Sheets

Crea una hoja en Google Sheets con una pestaña llamada **`Boletas`** y coloca estos encabezados en la **Fila 1**:

| Col A | Col B | Col C | Col D | Col E | Col F | Col G ... Col R (12 Meses) | Col S | Col T | Col U |
|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Numero** | **EstadoGeneral** | **Nombre** | **Telefono** | **CuotasPagadas** | **TotalAbonado** | **Ene** ... **Dic** | **UltimaRef** | **UltimoDrive** | **Notas** |

- **Columnas G a R**: Corresponden a los 12 meses (`Mes 1` a `Mes 12`). Cada celda registra si está `Pagado`, `En revisión` o `Pendiente`.

---

## 🚀 Inicio Rápido

```powershell
cd "C:\Users\xhiro\.gemini\antigravity\scratch\rifa-app"
npm.cmd run dev
```

- **Rifa Pública**: [http://localhost:3000](http://localhost:3000)
- **Panel de Administración**: [http://localhost:3000/admin](http://localhost:3000/admin) (Contraseña: `admin123`)

---

## 🛡️ Funcionalidades del Panel Admin (`/admin`)

1. **Cuotas por Revisar**: Comprobantes de mensualidades recién subidos por los participantes para aprobar o rechazar con 1 clic.
2. **Control de Morosos ("En Mora")**: Identifica de inmediato quién debe cuotas del mes con botón directo para **"Cobrar por WhatsApp"** con mensaje pre-redactado.
3. **Métricas en Tiempo Real**: Total recaudado en COP, número de boletas al día, morosas y completadas.
