# InventFlow

**Sistema de gestión de inventario para PYMEs** — desarrollado como challenge técnico para AranguriApps (posición Software Engineer Web).

**Demo en producción:** [challenge-tecnico-aranguri-apps.vercel.app](https://challenge-tecnico-aranguri-apps.vercel.app/)

---

## Índice

- [Descripción](#descripción)
- [Acceso de prueba](#acceso-de-prueba)
- [Stack técnico](#stack-técnico)
- [¿Por qué este stack?](#por-qué-este-stack)
- [Funcionalidades](#funcionalidades)
- [Arquitectura](#arquitectura)
- [Puesta en marcha local](#puesta-en-marcha-local)
- [Testing y CI](#testing-y-ci)
- [Documentación](#documentación)
- [Orquestación de IA](#orquestación-de-ia)

---

## Descripción

InventFlow es una aplicación web full-stack para que una PYME gestione su inventario de punta a punta: alta y seguimiento de productos, registro de movimientos de stock (entradas, salidas y ajustes), administración de proveedores y categorías, control de usuarios por rol, y un panel de control con indicadores y reportes.

El sistema está pensado con criterio de producto real, no de demo: control de acceso por rol, validaciones en capas, baja lógica con reactivación, integridad de stock garantizada a nivel base de datos, y una interfaz cuidada y responsive. Cada decisión está tomada para que el dato sea consistente sin importar desde dónde se escriba.

---

## Acceso de prueba

La demo está poblada con tres usuarios, uno por cada rol, para probar el control de acceso de un vistazo:

| Rol | Email | Contraseña | Permisos |
|-----|-------|-----------|----------|
| **Administrador** | `admin@email.com` | `Admin123` | Acceso total: ver, crear, editar, eliminar y gestionar usuarios |
| **Encargado** | `manager@email.com` | `Manager123` | Ver, crear y editar (sin eliminar ni gestionar usuarios) |
| **Lectura** | `viewer@email.com` | `Viewer123` | Solo consulta y exportación de reportes |

> Estos usuarios ya están cargados en la **demo desplegada en Vercel**. En una instalación local no existen: se crean registrándose desde `/register` y luego asignando el rol por SQL (ver el README de la carpeta `supabase/`).
>
> Iniciá sesión con cada uno para ver cómo la interfaz se adapta al rol: los botones de escritura y borrado solo aparecen cuando el rol lo permite.

---

## Stack técnico

| Capa | Tecnología |
|------|-----------|
| **Framework** | Next.js 16 (App Router, Server Actions) |
| **Lenguaje** | TypeScript (modo estricto) |
| **Estilos** | Tailwind CSS v4 + shadcn/ui |
| **Backend / DB** | Supabase (PostgreSQL + Auth + RLS) |
| **Gráficos** | Recharts |
| **Exportación** | ExcelJS |
| **Validación** | Zod + react-hook-form |
| **Testing** | Vitest |
| **CI/CD** | GitHub Actions + Vercel |

---

## ¿Por qué este stack?

La elección del stack no fue por moda, sino por una combinación deliberada de **velocidad de iteración** y **robustez**, alineada además con las herramientas que la empresa indicó preferir.

- **Next.js 16 (App Router + Server Actions).** Permite resolver frontend y backend dentro de un mismo framework, sin montar una API REST aparte para operaciones internas. Los Server Actions eliminan gran parte del boilerplate de capa de red y mantienen la lógica de escritura cerca del servidor, mientras que los React Server Components reducen el JavaScript enviado al cliente. Esto da autonomía full-stack con una sola base de código.
- **TypeScript en modo estricto.** Los contratos de tipos atrapan errores en tiempo de compilación, habilitan refactors seguros y funcionan como documentación viva. Es especialmente valioso cuando se orquesta IA para generar código: el compilador audita automáticamente una parte de esa salida, así que el modo estricto es una red de seguridad, no un costo.
- **Supabase (PostgreSQL + Auth + RLS).** Es el BaaS recomendado por AranguriApps, y aporta un PostgreSQL real —no un almacén NoSQL limitado—, con autenticación y Row Level Security integrados. Eso permite empujar la seguridad y la integridad hacia la base (políticas RLS, triggers) en lugar de confiar solo en la aplicación, acelerando el arranque sin renunciar al control fino de SQL.
- **Tailwind v4 + shadcn/ui.** Velocidad de maquetado con utilidades, sumada a componentes accesibles y *editables* (no una caja negra de terceros): el código de cada componente vive en el repo y se puede ajustar a la identidad visual del proyecto.

---

## Funcionalidades

- **Autenticación y roles** — login/registro con Supabase Auth, tres roles (admin / encargado / lectura) con jerarquía de permisos.
- **Productos** — CRUD completo con búsqueda en vivo, SKU, categoría, proveedor, precio y control de stock mínimo.
- **Movimientos de stock** — entradas, salidas y ajustes, con validación de stock suficiente y actualización automática del inventario vía triggers de base de datos.
- **Proveedores y categorías** — gestión independiente, con color identificatorio para categorías.
- **Dashboard** — KPIs en tiempo real (productos activos, stock crítico, movimientos, valor del inventario), gráficos de evolución y distribución, y tablas de resumen.
- **Gestión de usuarios** — panel exclusivo de admin para asignar roles y eliminar usuarios (baja lógica: el usuario eliminado pierde el acceso y se oculta, pero su historial se conserva).
- **Exportación a Excel** — reportes de movimientos con formato, respetando filtros.
- **Baja lógica con reactivación** — eliminar no destruye datos; recrear un registro dado de baja lo reactiva en vez de duplicar.

---

## Arquitectura

### Modelo de datos

El modelo en PostgreSQL se organiza en torno a `products` como núcleo, junto con `categories`, `suppliers`, `stock_movements` y `profiles`. El diagrama entidad-relación completo está en [`documentacion/`](#documentación).

Decisiones de diseño destacadas:

- **Integridad de stock a nivel DB** — el stock no se calcula en el frontend: un trigger de PostgreSQL (`handle_stock_movement`) actualiza `current_stock` ante cada movimiento, garantizando consistencia aunque se escriba desde cualquier cliente.
- **Movimientos inmutables** — `stock_movements` funciona como un libro contable: un trigger (`block_movement_mutation`) impide editar o borrar un movimiento ya registrado, preservando el historial de auditoría.
- **Seguridad en la base** — Row Level Security (RLS) con políticas por rol: la base de datos misma valida los permisos, no solo la aplicación.
- **Baja lógica** — las tablas con `is_active` (productos, proveedores, categorías y usuarios) permiten "eliminar" sin perder datos. En productos, proveedores y categorías hay reactivación case-insensitive al recrear; en usuarios la baja es definitiva (un usuario eliminado no puede volver a iniciar sesión, validado en el login y en el middleware).

### Organización del código

La organización sigue un criterio de **separación de responsabilidades y modularidad por entidad**, pensado para que el sistema escale y para mantener autonomía en ambos extremos del stack sin que una capa contamine a la otra:

- SQL consolidado en un único `schema.sql` que levanta la base completa desde cero, organizado en secciones comentadas (funciones, tablas, RLS, vistas, seed) para que se lea de corrido y sea simple de ejecutar.
- Server Actions separados por entidad, manteniendo el código cohesionado y fácil de ubicar.
- Clientes de Supabase divididos (browser / servidor) para soportar SSR correctamente.
- Validaciones con Zod compartidas entre cliente y servidor, evitando duplicar reglas de negocio.
- **Defensa en profundidad:** las validaciones críticas (como el stock) se verifican en tres niveles —el formulario, la Server Action y el trigger de la base— de manera que ninguna capa dependa ciegamente de la confiabilidad de la anterior.

Este enfoque modular hace que agregar una nueva entidad o ampliar el dominio sea una extensión predecible del patrón existente, no una reescritura.

### Decisiones de alcance

Algunas decisiones fueron conscientes sobre qué dejar dentro y fuera del alcance, priorizando un núcleo sólido:

- **Confirmación de email desactivada a propósito.** El registro valida el *formato* del email, pero la *verificación de propiedad* (confirmar la casilla vía link) está deshabilitada de forma deliberada para que la demo sea evaluable sin fricción: quien prueba el sistema puede registrarse y entrar al instante, sin depender de un correo. Es una función que Supabase Auth ya provee de forma nativa y se activa con un solo cambio de configuración en un entorno productivo; no requiere reescribir código. La decisión es de configuración de entorno, no de arquitectura.

---

## Puesta en marcha local

```bash
# 1. Clonar el repositorio
git clone https://github.com/altamirandapatricioseb/Challenge_Tecnico-AranguriApps.git
cd Challenge_Tecnico-AranguriApps

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env.local
# Completar con las credenciales de tu proyecto Supabase:
#   NEXT_PUBLIC_SUPABASE_URL
#   NEXT_PUBLIC_SUPABASE_ANON_KEY

# 4. Aplicar el schema en Supabase
# Todo el esquema está consolidado en supabase/migrations/schema.sql.
# Copiá su contenido en el SQL Editor de Supabase y ejecutalo una vez.
# El detalle está en supabase/README.md

# 5. Levantar el servidor de desarrollo
npm run dev
```

La aplicación queda disponible en `http://localhost:3000`.

---

## Testing y CI

- **Tests unitarios** — cobertura de la lógica de negocio pura (cálculo de stock, permisos por rol, formato), con Vitest. Son funciones deterministas sin dependencias de red ni mocks.

```bash
npm test          # correr los tests
npm run build     # build de producción con verificación de tipos estricta
```

- **Integración continua** — un workflow de GitHub Actions corre en cada push a `main`: lint, verificación de tipos, tests y build. El build usa variables dummy (no se conecta a la base real) porque solo verifica que el código compile; los tests no requieren base de datos.

---

## Documentación

Toda la documentación del proyecto está en la carpeta [`documentacion/`](./documentacion):

| Documento | Descripción |
|-----------|-------------|
| **Diagrama ER** | Modelo entidad-relación de la base (generado desde Supabase). |
| **Diagrama de casos de uso** | Actores, roles y relaciones include/extend. |
| **Diagrama de Gantt** | Funcionalidades y sus dependencias. |
| **Flujos principales** | Diagramas de flujo de los procesos clave del sistema. |
| **Tablero de tareas** | Organización del trabajo por tipo de tarea. |
| **Matriz de casos de prueba** | Casos de prueba con su resultado, derivados del QA real del desarrollo. |
| **Manual de usuario** | Guía de uso del sistema por funcionalidad. |

> La documentación fue elaborada de forma manual (diagramas en draw.io, planillas y documentos propios), como parte del análisis y diseño del sistema.

---

## Orquestación de IA

> Esta sección documenta cómo utilicé herramientas de IA durante el desarrollo. El criterio rector fue claro: **las decisiones de ingeniería y arquitectura son mías y están justificadas; la IA aceleró el trabajo mecánico, repetitivo y de bajo riesgo.** No usé una sola herramienta de forma genérica, sino que diversifiqué según la naturaleza de cada tarea, aprovechando lo que cada una hace mejor y manteniendo siempre el control sobre el rumbo del proyecto. El patrón de trabajo fue consistente: yo definía el *qué* y el *por qué* (lógica, arquitectura, criterios de diseño y QA), y la IA ejecutaba el *cómo* bajo reglas explícitas.

### Planificación y razonamiento

Antes de escribir una sola línea de código seguí un flujo de **Exploración → Planificación → Ejecución**, justamente para minimizar errores de contexto y retrabajo.

- **Exploración:** entendí los requisitos del challenge, mapeé las entidades y sus relaciones, y definí un alcance realista para una semana, priorizando solidez por sobre cantidad de features.
- **Planificación:** dividí el sistema en bloques con dependencias explícitas y los ordené de abajo hacia arriba.
- **Ejecución por capas**, en este orden y por estas razones:
  1. **Base de datos primero.** Todo el sistema se apoya en el modelo de datos; un cambio de schema tardío se propaga a Server Actions, validaciones y UI. Fijar el modelo al inicio evita ese efecto dominó.
  2. **Autenticación y roles.** Condicionan el acceso a cada módulo, así que tenían que estar resueltos antes de construir funcionalidades que dependen del rol del usuario.
  3. **Funcionalidades** (CRUD, movimientos, dashboard), ya apoyadas sobre un modelo y un sistema de permisos estables.
  4. **Testing y documentación** al final, sobre una superficie ya consolidada.

Usé Claude como interlocutor para validar ese plan, ordenar prioridades y discutir trade-offs de arquitectura antes de comprometerme con un camino. La IA funcionó como un par con quien razonar en voz alta, pero la decisión final sobre qué construir y en qué orden fue siempre mía.

### Diseño y previsualización de interfaces

El diseño se centró deliberadamente en la **fidelidad visual y la atención al detalle (UI/UX)**, con el objetivo de garantizar un flujo sin fricciones para el usuario operativo. Pensé las pantallas priorizando **densidad de información** para un uso diario y de consulta rápida, y una **paleta oscura con acento ámbar** para reducir la fatiga visual en jornadas largas y darle a la interfaz una jerarquía clara entre acción primaria, secundaria y dato.

Antes de implementarlas, exploré variantes de layout y jerarquía visual con Claude Design, lo que me permitió iterar rápido sobre el diseño y descartar opciones sin gastar tiempo maquetando a mano algo que después no iba a usar. Detalles de UX que definí yo y que se sostienen en toda la app: estados de la interfaz adaptados al rol (los botones de escritura y borrado solo aparecen cuando el rol lo habilita), búsqueda en vivo con feedback inmediato, y un layout responsive que no rompe el flujo en pantallas chicas. La identidad visual final responde a decisiones de UX mías; la IA me ayudó a verlas antes de codearlas.

### Implementación del código

La arquitectura la definí yo: Server Actions separados por entidad para mantener el código cohesionado, validación en capas para no confiar nunca en el cliente, e integridad de stock garantizada en la base de datos y no en el frontend, porque el dato no puede depender de quién lo escribe. Esa decisión de **modularidad por entidad** es la que permite escalar el sistema agregando dominio sin reescribir lo existente.

Dado el volumen de código del proyecto, usé Claude Code para acelerar la escritura de las partes repetitivas: el CRUD que sigue el mismo patrón entre las distintas entidades, los formularios análogos y el boilerplate de configuración. Revisé y ajusté cada pieza para que respetara las decisiones de diseño establecidas. La IA escribió el código mecánico; el criterio de qué construir y cómo estructurarlo fue mío.

Un ejemplo concreto de ese control fue la gestión de productos, categorías y proveedores. Una salida rápida habría sido dejar el alta, edición y baja de esas entidades como operaciones de SQL manual sobre la base —más veloz de improvisar, pero inservible como producto—. Definí que toda la gestión (agregado, edición y borrado) tenía que resolverse **dentro de la aplicación**, con sus formularios, validaciones y control de acceso por rol, no desde el editor de SQL. El mismo criterio apliqué a la gestión de usuarios: en lugar de cambiar roles con UPDATE manuales, construí un panel de administración donde el cambio de rol pasa por la RLS y los permisos reales del sistema. La IA aceleró la escritura de esos formularios y pantallas; la decisión de que el sistema se administrara a sí mismo, y no por SQL suelto, fue mía.

### Depuración y diagnóstico de errores

Durante el desarrollo aparecieron errores no triviales. Uno representativo fue un error de tipos estrictos que solo afloraba en el build de producción de Vercel y no en `npm run dev` local: varias columnas que llegaban desde las vistas de Supabase venían tipadas como `string | null` (por ejemplo `created_at`), mientras que funciones como `formatDateTime` esperaban un `string` no nulo. El atajo que aparecía —y que es tentador cuando solo querés destrabar el deploy— era silenciarlo con `any` o un `@ts-ignore` y seguir de largo. Lo rechacé: ese parche habría hecho pasar el build escondiendo el problema de fondo, que era que el código no contemplaba el caso nulo que el tipo declaraba como posible. La solución fue acotar el null explícitamente en cada punto de uso (mostrar un guion o una celda vacía cuando el valor no existe), de modo que el compilador siguiera funcionando como garantía y no como un obstáculo a esquivar. Usé la IA para acelerar el diagnóstico —leer las trazas del build, ubicar cada punto donde el tipo nullable chocaba con la función—, pero la decisión de cómo resolver de fondo fue criterio propio de QA. La regla fue siempre resolver la causa, no parchar el síntoma.

### Aceleración de tareas de datos repetitivas

Para tareas de alto volumen y bajo riesgo intelectual —procesar o transformar conjuntos de datos, generar datos de ejemplo consistentes para la demo, o automatizar transformaciones mecánicas— me apoyé en la IA para no invertir tiempo manual en trabajo que no requería decisión de diseño, reservando mi atención para las partes que sí lo requerían.

### Prolijidad del historial de Git

Para mantener un historial de Git limpio y profesional, me apoyé en Google Gemini para pulir la redacción de los mensajes de commit. Quiero ser preciso con el reparto de roles: **yo definía qué cambios entraban en cada commit y en qué punto cortar** —esa segmentación atómica es una decisión de ingeniería, no de la herramienta—, y Gemini solo me asistía en redactar el texto del mensaje, que revisaba antes de confirmarlo. La herramienta nunca tocó el repositorio ni decidió los límites de un commit; fue asistencia de redacción sobre decisiones que yo ya había tomado. La elegí para esto por ser una tarea de alto volumen y bajo riesgo, fácil de separar del flujo principal de codificación con Claude: así pude commitear seguido sin frenar el desarrollo para redactar cada mensaje a mano. El resultado es un historial de commits atómicos, cada uno con un mensaje claro y descriptivo que refleja un cambio acotado.

### Gobierno de la IA

A lo largo del proyecto trabajé con un conjunto de convenciones y reglas explícitas para guiar a las herramientas de IA: definí de antemano el estilo de código, las convenciones de nombres, el alcance permitido en cada intervención y el formato esperado de las respuestas, de modo que la IA produjera resultados consistentes con mis decisiones en lugar de imponer las suyas. Este enfoque de orquestación —tratar a la IA como un ejecutor guiado y no como un piloto automático— es lo que permitió aprovechar su velocidad sin ceder el control técnico del proyecto.

---

**Autor:** Patricio Altamiranda — Challenge técnico Software Engineer Web, AranguriApps.
