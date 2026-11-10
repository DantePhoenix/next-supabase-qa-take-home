# Medallo QA Take Home

**[English](#english)** · **[Español](#español)**

A Next.js + [Supabase](https://supabase.com) app that lets users search, filter and page through 10,000 records of synthetic coffee and health data. Your job is to test it with automated end-to-end (E2E) tests.

---

## English

### 1. System requirements

| Requirement | Version | Install |
| --- | --- | --- |
| [Node.js](https://nodejs.org/) | 24 or later | [nodejs.org/en/download](https://nodejs.org/en/download) |
| [pnpm](https://pnpm.io/) | 10 or later | `corepack enable` or [pnpm.io/installation](https://pnpm.io/installation) |
| [Docker](https://www.docker.com/) | Latest stable | [docs.docker.com/get-docker](https://docs.docker.com/get-docker/) |

Docker must be **running** before setup. On Windows, use WSL 2 or Git Bash to run the setup script.

### 2. Setup (one command)

```bash
git clone <repository-url>
cd next-supabase-qa-take-home
./setup.sh
```

`./setup.sh` (also available as `pnpm bootstrap`) does everything:

1. Checks Node.js, pnpm and Docker.
2. Installs dependencies.
3. Converts `data/synthetic_coffee_health_10000.csv` into a database seed file.
4. Starts the Supabase Docker containers.
5. Applies the database migration, loads all 10,000 rows and writes `.env.local`.
6. Verifies the database has exactly 10,000 rows.

The first run downloads the Supabase Docker images and can take several minutes. The script is safe to run again at any time; it resets the database to a clean state.

### 3. Run the app

```bash
pnpm dev:next
```

Open [http://localhost:3000](http://localhost:3000).

| Useful command | What it does |
| --- | --- |
| `pnpm dev:next` | Start the Next.js app |
| `pnpm dev` | Start Supabase and Next.js together |
| `pnpm db:seed` | Reset the database and reload the 10,000 rows |
| `pnpm stop` | Stop the Supabase containers |
| `API_DELAY_MS=1500 pnpm dev:next` | Start the app with an artificial API delay (in milliseconds) so loading states are easy to see |

Supabase Studio (a web UI for the database) is at [http://localhost:64323](http://localhost:64323). You can use it, or the API at `GET /api/records`, to work out expected results for your tests.

**Ports in use:** the app uses `3000`, and Supabase uses `64320`–`64329`. If setup fails with "port is already allocated", stop whatever is using that port and run `./setup.sh` again.

### 4. The application

There is a single page at `/` called **Coffee & Health Explorer**. It shows a table of records and these controls:

| Feature | Expected behaviour |
| --- | --- |
| **Initial load** | While the first page of data loads, placeholder (skeleton) rows are shown and the summary reads "Loading records…". Then 25 rows appear, sorted by ID ascending. |
| **Loading indicator** | Every time data is requested (search, filter, page change), a "Loading…" indicator appears, the table is dimmed and marked `aria-busy="true"`, and the pagination buttons are disabled until the response arrives. |
| **Search** | Free text. Matches records whose **country**, **occupation** or **health issue** contains the text (case-insensitive). If the text is a whole number, the record with that **ID** also matches. The request is sent shortly after the user stops typing. |
| **Country** | Multi-select. Shows records from **any** of the selected countries. |
| **Gender, Sleep quality, Stress level, Smoker** | Single-select. "All…" / "Any" means no filter. |
| **Age, Coffee intake** | Minimum and maximum, both **inclusive**. Either can be left empty. Age must be 0–130 and coffee intake 0–20. If a value is out of range or the minimum is greater than the maximum, a validation message appears and no request is sent. |
| **Combining** | Search and all filters combine with **AND**. |
| **Reset filters** | Clears search and every filter and returns to page 1. Disabled when nothing is filtered. |
| **Empty state** | When nothing matches, the table shows "No records match your search and filters." |
| **Error state** | If the API fails, an error message is shown in place of the table. |
| **Results summary** | "Showing X–Y of Z records", where X–Y is the range of rows on the current page and Z is the total number of matching records. |
| **Rows per page** | 10, 25 (default), 50 or 100. Changing it returns to page 1. |
| **Pagination** | "Page N of M", where M is the number of pages needed to show **every** matching record. First / Previous are disabled on page 1; Next / Last are disabled on the last page. Every matching record must be reachable. |
| **Page reset** | Changing search, any filter or rows per page returns to page 1. |
| **URL state** | Search, filters, page and rows per page are stored in the URL query string. Reloading the page or opening a shared URL restores the same view. |

Every important element has a `data-testid` attribute (for example `search-input`, `filter-gender`, `country-option-Japan`, `result-row`, `results-summary`, `page-indicator`, `page-next`, `loading-indicator`, `empty-state`). Each row has `data-row-id`, and each cell has `data-col` (for example `data-col="country"`). You are free to use these, roles/labels, or any other locator strategy.

### 5. The exercise

1. **Choose an automation tool.** Any E2E tool is fine (for example Playwright, Cypress, Selenium/WebdriverIO, TestCafe or Robot Framework), in any language. Add it to this repository.
2. **Write automated E2E tests** that run against the app in a real browser. At a minimum, cover:
   - **Loading:** initial load, loading indicator and skeleton rows, the table becoming ready.
   - **Searching:** by text, by ID, case-insensitivity, no-match results, clearing the search.
   - **Filtering:** each filter on its own, numeric ranges and their boundaries, validation messages, combining filters with search, reset.
   - **Pagination:** moving between pages, page size, the summary and page indicator, the first and last pages, page reset after a filter change.
   - **URL state:** reloading and deep-linking.
3. **Make the tests reliable.** They should pass (or fail) the same way every run. Avoid fixed sleeps; wait on application state instead.
4. **Make them easy to run.** Add a script such as `pnpm test:e2e` and document it.
5. **Report defects.** If you find behaviour that doesn't match the table in section 4, write a bug report for each one and keep the test that exposes it. The test should fail, or be clearly marked as a known failure that points to the bug report.

Feel free to also test things through the API (`GET /api/records`) or the database if it helps, but the core of the submission is browser E2E tests.

#### What to deliver

- Your test code, committed to this repository (a branch or a zip of the repository is fine).
- A short `TESTING.md` (in English or Spanish) with:
  - which tool you chose and why,
  - how to run the tests,
  - how your tests are organised and what they cover,
  - what you would add with more time,
  - a **bug report** for each defect found: title, steps to reproduce, expected result, actual result, severity, and a screenshot if helpful.

#### Using AI

AI-assisted development is welcome. During the review we will ask you to walk us through your tests and explain your choices, so make sure you understand everything you submit.

#### Useful facts about the data

The full dataset has **10,000** records with IDs 1–10,000. There are 20 countries, three genders (`Female`, `Male`, `Other`), four sleep qualities (`Poor`, `Fair`, `Good`, `Excellent`), three stress levels (`Low`, `Medium`, `High`), and four health issue values (`None`, `Mild`, `Moderate`, `Severe`). The data never changes between runs, so you can safely assert on exact counts. Work them out yourself in Supabase Studio or with the API.

---

## Español

### 1. Requisitos del sistema

| Requisito | Versión | Instalación |
| --- | --- | --- |
| [Node.js](https://nodejs.org/) | 24 o superior | [nodejs.org/en/download](https://nodejs.org/en/download) |
| [pnpm](https://pnpm.io/) | 10 o superior | `corepack enable` o [pnpm.io/installation](https://pnpm.io/installation) |
| [Docker](https://www.docker.com/) | Última versión estable | [docs.docker.com/get-docker](https://docs.docker.com/get-docker/) |

Docker debe estar **en ejecución** antes de la configuración. En Windows, usa WSL 2 o Git Bash para ejecutar el script de configuración.

### 2. Configuración (un solo comando)

```bash
git clone <url-del-repositorio>
cd next-supabase-qa-take-home
./setup.sh
```

`./setup.sh` (también disponible como `pnpm bootstrap`) lo hace todo:

1. Verifica Node.js, pnpm y Docker.
2. Instala las dependencias.
3. Convierte `data/synthetic_coffee_health_10000.csv` en un archivo de seed para la base de datos.
4. Inicia los contenedores Docker de Supabase.
5. Aplica la migración de la base de datos, carga las 10,000 filas y escribe `.env.local`.
6. Verifica que la base de datos tenga exactamente 10,000 filas.

La primera ejecución descarga las imágenes Docker de Supabase y puede tardar varios minutos. Puedes volver a ejecutar el script cuando quieras; deja la base de datos en un estado limpio.

### 3. Ejecutar la aplicación

```bash
pnpm dev:next
```

Abre [http://localhost:3000](http://localhost:3000).

| Comando útil | Qué hace |
| --- | --- |
| `pnpm dev:next` | Inicia la aplicación Next.js |
| `pnpm dev` | Inicia Supabase y Next.js juntos |
| `pnpm db:seed` | Reinicia la base de datos y vuelve a cargar las 10,000 filas |
| `pnpm stop` | Detiene los contenedores de Supabase |
| `API_DELAY_MS=1500 pnpm dev:next` | Inicia la aplicación con un retraso artificial en la API (en milisegundos) para ver fácilmente los estados de carga |

Supabase Studio (una interfaz web para la base de datos) está en [http://localhost:64323](http://localhost:64323). Puedes usarlo, o la API en `GET /api/records`, para calcular los resultados esperados de tus pruebas.

**Puertos en uso:** la aplicación usa `3000` y Supabase usa `64320`–`64329`. Si la configuración falla con "port is already allocated", detén lo que esté usando ese puerto y vuelve a ejecutar `./setup.sh`.

### 4. La aplicación

Hay una sola página en `/` llamada **Coffee & Health Explorer**. Muestra una tabla de registros y estos controles:

| Funcionalidad | Comportamiento esperado |
| --- | --- |
| **Carga inicial** | Mientras carga la primera página de datos, se muestran filas de marcador de posición (skeleton) y el resumen dice "Loading records…". Luego aparecen 25 filas, ordenadas por ID ascendente. |
| **Indicador de carga** | Cada vez que se solicitan datos (búsqueda, filtro, cambio de página), aparece un indicador "Loading…", la tabla se atenúa y se marca con `aria-busy="true"`, y los botones de paginación se desactivan hasta que llega la respuesta. |
| **Búsqueda** | Texto libre. Coincide con los registros cuyo **país** (country), **ocupación** (occupation) o **problema de salud** (health issue) contiene el texto (sin distinguir mayúsculas y minúsculas). Si el texto es un número entero, también coincide el registro con ese **ID**. La solicitud se envía poco después de que el usuario deja de escribir. |
| **País (Country)** | Selección múltiple. Muestra registros de **cualquiera** de los países seleccionados. |
| **Género, Calidad del sueño, Nivel de estrés, Fumador** | Selección única. "All…" / "Any" significa sin filtro. |
| **Edad, Consumo de café** | Mínimo y máximo, ambos **inclusivos**. Cualquiera puede quedar vacío. La edad debe estar entre 0 y 130 y el consumo de café entre 0 y 20. Si un valor está fuera de rango o el mínimo es mayor que el máximo, aparece un mensaje de validación y no se envía ninguna solicitud. |
| **Combinación** | La búsqueda y todos los filtros se combinan con **Y** (AND). |
| **Reset filters** | Borra la búsqueda y todos los filtros y vuelve a la página 1. Está desactivado cuando no hay ningún filtro. |
| **Estado vacío** | Cuando nada coincide, la tabla muestra "No records match your search and filters." |
| **Estado de error** | Si la API falla, se muestra un mensaje de error en lugar de la tabla. |
| **Resumen de resultados** | "Showing X–Y of Z records", donde X–Y es el rango de filas de la página actual y Z es el número total de registros que coinciden. |
| **Filas por página** | 10, 25 (por defecto), 50 o 100. Cambiarlo vuelve a la página 1. |
| **Paginación** | "Page N of M", donde M es el número de páginas necesarias para mostrar **todos** los registros que coinciden. First / Previous están desactivados en la página 1; Next / Last están desactivados en la última página. Todos los registros que coinciden deben ser accesibles. |
| **Reinicio de página** | Cambiar la búsqueda, cualquier filtro o las filas por página vuelve a la página 1. |
| **Estado en la URL** | La búsqueda, los filtros, la página y las filas por página se guardan en la query string de la URL. Recargar la página o abrir una URL compartida restaura la misma vista. |

Cada elemento importante tiene un atributo `data-testid` (por ejemplo `search-input`, `filter-gender`, `country-option-Japan`, `result-row`, `results-summary`, `page-indicator`, `page-next`, `loading-indicator`, `empty-state`). Cada fila tiene `data-row-id` y cada celda tiene `data-col` (por ejemplo `data-col="country"`). Puedes usar estos atributos, roles/etiquetas o cualquier otra estrategia de localización.

### 5. El ejercicio

1. **Elige una herramienta de automatización.** Cualquier herramienta E2E sirve (por ejemplo Playwright, Cypress, Selenium/WebdriverIO, TestCafe o Robot Framework), en cualquier lenguaje. Agrégala a este repositorio.
2. **Escribe pruebas E2E automatizadas** que se ejecuten contra la aplicación en un navegador real. Como mínimo, cubre:
   - **Carga:** carga inicial, indicador de carga y filas skeleton, la tabla lista para usarse.
   - **Búsqueda:** por texto, por ID, sin distinguir mayúsculas, resultados sin coincidencias, borrar la búsqueda.
   - **Filtros:** cada filtro por separado, rangos numéricos y sus límites, mensajes de validación, combinación de filtros con búsqueda, reinicio.
   - **Paginación:** navegar entre páginas, tamaño de página, el resumen y el indicador de página, la primera y la última página, reinicio de página después de cambiar un filtro.
   - **Estado en la URL:** recargar y enlaces directos.
3. **Haz que las pruebas sean confiables.** Deben pasar (o fallar) de la misma forma en cada ejecución. Evita esperas fijas (sleeps); espera el estado de la aplicación.
4. **Haz que sean fáciles de ejecutar.** Agrega un script como `pnpm test:e2e` y documéntalo.
5. **Reporta defectos.** Si encuentras un comportamiento que no coincide con la tabla de la sección 4, escribe un reporte de bug para cada uno y conserva la prueba que lo expone. La prueba debe fallar, o estar marcada claramente como un fallo conocido que haga referencia al reporte de bug.

Si te ayuda, también puedes probar cosas a través de la API (`GET /api/records`) o de la base de datos, pero lo principal de la entrega son las pruebas E2E en el navegador.

#### Qué entregar

- Tu código de pruebas, en este repositorio (una rama o un zip del repositorio está bien).
- Un `TESTING.md` breve (en inglés o español) con:
  - qué herramienta elegiste y por qué,
  - cómo ejecutar las pruebas,
  - cómo están organizadas tus pruebas y qué cubren,
  - qué agregarías con más tiempo,
  - un **reporte de bug** por cada defecto encontrado: título, pasos para reproducir, resultado esperado, resultado obtenido, severidad y una captura de pantalla si ayuda.

#### Uso de IA

El desarrollo asistido por IA es bienvenido. Durante la revisión te pediremos que nos expliques tus pruebas y tus decisiones, así que asegúrate de entender todo lo que entregas.

#### Datos útiles sobre el conjunto de datos

El conjunto completo tiene **10,000** registros con IDs del 1 al 10,000. Hay 20 países, tres géneros (`Female`, `Male`, `Other`), cuatro calidades de sueño (`Poor`, `Fair`, `Good`, `Excellent`), tres niveles de estrés (`Low`, `Medium`, `High`) y cuatro valores de problemas de salud (`None`, `Mild`, `Moderate`, `Severe`). Los datos no cambian entre ejecuciones, así que puedes verificar conteos exactos sin problema. Calcúlalos tú mismo en Supabase Studio o con la API.
