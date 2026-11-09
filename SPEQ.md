# SPEC.md — Test de Afinidad Electoral Baleares 29N (Elecciones Generales 2026)

## 1. Visión General y Restricciones Clave
Aplicación web estática Mobile-First (sin backend en vivo ni base de datos en servidor) para calcular la afinidad electoral de los votantes de la circunscripción de **Illes Balears** en las Elecciones Generales del 29 de noviembre de 2026.
- **Usuarios objetivo:** Grupo reducido (3-4 personas) desde teléfono móvil (iOS/Android).
- **Arquitectura 100 % desacoplada:**
  1. `/pipeline`: Scripts locales en Python 3.11+ que usan el SDK `google-genai` y Pydantic para procesar PDFs de programas electorales y generar un JSON estático validado.
  2. `/web` (o raíz con Vite): Web App estática en HTML5 + TypeScript + Tailwind CSS que consume `public/data/cuestionario.json` y guarda todo el progreso del usuario en `localStorage`.
- **REGLA ESTRICTA DE GIT PARA EL AGENTE:** El agente NUNCA debe ejecutar `git commit`, `git push` ni alterar ramas por su cuenta. El control de versiones lo ejecuta exclusivamente el usuario humano tras verificar cada incremento.

---

## 2. Partidos Políticos (Circunscripción Illes Balears - Congreso 29N)
El sistema evalúa exactamente las 8 candidaturas presentadas al Congreso por Baleares:
1. `PP` — Partido Popular (Cabeza de lista: José Vicente Marí Bosó) | Color: `#0056A7`
2. `PSIB` — PSIB-PSOE (Cabeza de lista: Francina Armengol) | Color: `#E30613`
3. `VOX` — Vox (Cabeza de lista: Maribel Cerezo) | Color: `#63BE21`
4. `ARAMES` — Ara Més - Front Ampli (Cabeza de lista: Carme Gomila) | Color: `#E51C55`
5. `FO` — Frente Obrero (Cabeza de lista: Selva Lucía Belmaña) | Color: `#B91C1C`
6. `PACMA` — Partido Animalista con el Medio Ambiente (Cabeza de lista: María Remedios García) | Color: `#84CC16`
7. `PCTE` — Partido Comunista de los Trabajadores de España (Cabeza de lista: Joan Luna) | Color: `#7F1D1D`
8. `SALF` — Se Acabó la Fiesta (Cabeza de lista: Daniel Rodríguez) | Color: `#4B5563`

---

## 3. Bloques Temáticos (8 Bloques con Enfoque Estatal y Balear)
1. `vivienda` — Vivienda, Alquiler Residencial y Regulación de Pisos Turísticos.
2. `turismo` — Modelo Turístico, Masificación, Ecotasa y Límites Insulares.
3. `inmigracion` — Inmigración, Control de Fronteras y Gestión de la Ruta Balear.
4. `medio_ambiente` — Medio Ambiente, Territorio, Recursos Hídricos, Energía y Bienestar Animal.
5. `economia` — Economía, Fiscalidad, Autónomos y Régimen Especial Balear (REB).
6. `trabajo` — Trabajo, Salarios, Coste de Vida Insular y Pensiones.
7. `modelo_estado` — Modelo Territorial, Financiación Autonómica, Lengua e Instituciones.
8. `servicios_seguridad` — Sanidad, Educación, Conectividad/Transporte y Seguridad Ciudadana.

---

## 4. Mecánica de "3 Tandas Acumulativas" (Banco de 90 Preguntas)
Para evitar fatiga y permitir repetir el test hasta 3 veces con preguntas distintas que consoliden el resultado:
- **Banco Total (`cuestionario.json`):** Objetivo de **75 a 90 preguntas** (entre 9 y 12 por cada uno de los 8 bloques), etiquetadas con `"tanda": 1`, `"tanda": 2` o `"tanda": 3` (reparto equilibrado de bloques en cada tanda).
- **Funcionamiento de las Tandas:**
  - **Tanda 1 (Test Rápido - 25 a 30 preguntas):** Responde las preguntas de `tanda == 1`. Al terminar, muestra los resultados completos con una precisión base (33 % del banco total).
  - **Tanda 2 (Consolidación - 25 a 30 preguntas nuevas):** Desde la pantalla de resultados, el usuario puede pulsar *"Afianzar afinidad: Hacer Tanda 2"*. Solo aparecen las preguntas de `tanda == 2`. Los resultados finales se recalculan sumando las respuestas de Tanda 1 + Tanda 2 (66 % de precisión).
  - **Tanda 3 (Test Exhaustivo - 25 a 30 preguntas nuevas):** Permite jugar la `tanda == 3` y consolida el 100 % del banco (todas las preguntas respondidas).
- **Modo Personalizado por Bloques:** En la pantalla de inicio, el usuario también puede filtrar si solo quiere responder preguntas de ciertos bloques específicos (ej. solo Vivienda, Turismo e Inmigración).

---

## 5. Motor Matemático de Afinidad (Determinista en Frontend)
Escala Likert de 5 puntos tanto para la respuesta del usuario ($U_i$) como para la postura del partido ($P_i$):
- `-2`: Totalmente en contra
- `-1`: Más bien en contra
- `0`: Neutral / Depende / Propuesta ambigua
- `+1`: Más bien a favor
- `+2`: Totalmente a favor
- `null`: El partido no se pronuncia sobre este tema en su programa ni en declaraciones verificadas.

### Ponderación por importancia ($W_i$):
En cada tarjeta de pregunta el usuario puede marcar:
- **Importancia normal:** $W_i = 1.0$ (por defecto)
- **Tema clave para mí (🔥 Doble peso):** $W_i = 2.0$
- **Saltar pregunta / No sé:** $W_i = 0$ (no computa en el denominador)

### Cálculo por pregunta y partido:
Para cada pregunta respondida $i$ con $W_i > 0$:
1. Si $P_i$ es un número entre `-2` y `+2`:
   `afinidad_pregunta = (1 - (Math.abs(U_i - P_i) / 4)) * W_i`
2. Si $P_i$ es `null` (silencio programático):
   - No suma puntos de afinidad (`0`), pero se contabiliza en un contador separado `preguntas_sin_postura` para mostrar en la pantalla de resultados el **"Índice de Transparencia/Cobertura Programática"** de cada partido (qué % de los temas preguntados aborda realmente ese partido).
   - Para el porcentaje de afinidad del partido, se divide la suma de `afinidad_pregunta` entre la suma de pesos $W_i$ de las preguntas donde el partido sí tiene postura definida, aplicando un factor de corrección suave si el partido tiene más de un 30 % de silencios programáticos:
   `factor_cobertura = Math.min(1, cobertura_partido / 0.70)`
   `porcentaje_final = (suma_afinidad / suma_pesos_validos) * 100 * factor_cobertura`

---

## 6. Contrato de Datos (`public/data/cuestionario.json`)
```json
{
  "metadata": {
    "elecciones": "Elecciones Generales 29N 2026 - Circunscripción Illes Balears",
    "ultima_actualizacion": "2026-11-09",
    "version": "1.0.0",
    "partidos": [
      { "id": "PP", "siglas": "PP", "nombre": "Partido Popular", "candidato_baleares": "José Vicente Marí Bosó", "color": "#0056A7" },
      { "id": "PSIB", "siglas": "PSIB-PSOE", "nombre": "Partit dels Socialistes de les Illes Balears", "candidato_baleares": "Francina Armengol", "color": "#E30613" },
      { "id": "VOX", "siglas": "VOX", "nombre": "Vox", "candidato_baleares": "Maribel Cerezo", "color": "#63BE21" },
      { "id": "ARAMES", "siglas": "ARA MÉS - FRONT AMPLI", "nombre": "Ara Més - Front Ampli", "candidato_baleares": "Carme Gomila", "color": "#E51C55" },
      { "id": "FO", "siglas": "FO", "nombre": "Frente Obrero", "candidato_baleares": "Selva Lucía Belmaña", "color": "#B91C1C" },
      { "id": "PACMA", "siglas": "PACMA", "nombre": "Partido Animalista con el Medio Ambiente", "candidato_baleares": "María Remedios García", "color": "#84CC16" },
      { "id": "PCTE", "siglas": "PCTE", "nombre": "Partido Comunista de los Trabajadores de España", "candidato_baleares": "Joan Luna", "color": "#7F1D1D" },
      { "id": "SALF", "siglas": "SALF", "nombre": "Se Acabó la Fiesta", "candidato_baleares": "Daniel Rodríguez", "color": "#4B5563" }
    ],
    "bloques": [
      { "id": "vivienda", "nombre": "Vivienda y Alquiler", "icono": "Home" },
      { "id": "turismo", "nombre": "Turismo y Modelo Balear", "icono": "Palmtree" },
      { "id": "inmigracion", "nombre": "Inmigración y Fronteras", "icono": "Globe" },
      { "id": "medio_ambiente", "nombre": "Medio Ambiente y Territorio", "icono": "Leaf" },
      { "id": "economia", "nombre": "Economía, Impuestos y REB", "icono": "TrendingUp" },
      { "id": "trabajo", "nombre": "Trabajo y Pensiones", "icono": "Briefcase" },
      { "id": "modelo_estado", "nombre": "Modelo Territorial y Lengua", "icono": "Landmark" },
      { "id": "servicios_seguridad", "nombre": "Servicios Públicos y Seguridad", "icono": "Shield" }
    ]
  },
  "preguntas": [
    {
      "id": "tur_01",
      "tanda": 1,
      "bloque": "turismo",
      "tipo": "programa_29n",
      "enunciado": "Se debe prohibir la creación de nuevas plazas de alquiler turístico en las Islas Baleares y reducir progresivamente las existentes para destinarlas a vivienda residencial.",
      "contexto_opcional": "En Baleares la presión de las viviendas vacacionales sobre el mercado residencial es uno de los ejes centrales del debate insular.",
      "posturas": {
        "PP": { "valor": -1, "cita": "Defensa de la seguridad jurídica de los propietarios, lucha contra la oferta ilegal pero rechazo al decrecimiento turístico forzoso.", "fuente": "Ejes programáticos PP Balears" },
        "PSIB": { "valor": 1, "cita": "Tope estricto a las plazas turísticas y reversión de viviendas turísticas hacia el mercado residencial habitual.", "fuente": "Compromisos PSIB-PSOE 29N" },
        "VOX": { "valor": -2, "cita": "Libertad de propiedad privada para alquilar sin prohibiciones ni intervencionismo sobre el sector turístico.", "fuente": "Programa Marco VOX" },
        "ARAMES": { "valor": 2, "cita": "Decrecimiento turístico inmediato, moratoria total y prohibición de pisos turísticos en zonas tensionadas.", "fuente": "Propuestas Ara Més - Front Ampli" },
        "FO": { "valor": 1, "cita": "Planificación estatal frente a la turistificación masiva que expulsa a los trabajadores de sus barrios.", "fuente": "Programa Frente Obrero" },
        "PACMA": { "valor": 2, "cita": "Freno a la masificación turística por su impacto ambiental, hídrico y sobre el territorio insular.", "fuente": "Programa PACMA Medio Ambiente y Turismo" },
        "PCTE": { "valor": 2, "cita": "Expropiación de grandes tenedores y fondos turísticos para garantizar vivienda pública obrera.", "fuente": "Programa Electoral PCTE" },
        "SALF": { "valor": -2, "cita": "Defensa absoluta de la propiedad privada y rechazo a las restricciones estatales sobre el uso de la vivienda.", "fuente": "Ideario SALF" }
      }
    }
  ]
}
```

---

## 7. Diseño de Pantallas (UI Mobile-First)
Contenedor centrado `max-w-md mx-auto min-h-screen` con estética limpia, moderna y neutral:
1. **Pantalla de Inicio:**
   - Resumen del estado actual del usuario en `localStorage` (ej. *"Llevas 0/3 tandas completadas"* o botón *"Continuar por la pregunta 14"*).
   - Selector para iniciar **Tanda 1 (25-30 preguntas)** o filtrar por bloques temáticos concretos.
   - Botón secundario para *"Reiniciar test desde cero"*.
2. **Pantalla de Cuestionario (Tarjeta a Tarjeta):**
   - Barra de progreso superior de la tanda actual, badge con el nombre del bloque temático y botón *"¿Qué implica esto?"* que despliega `contexto_opcional`.
   - 5 botones grandes táctiles (`Totalmente a favor`, `Más bien a favor`, `Neutral / Depende`, `Más bien en contra`, `Totalmente en contra`).
   - Switch/botón inferior: **"🔥 Tema clave para mí (valora el doble)"** y enlace **"Saltar pregunta"**.
   - Botón para volver a la pregunta anterior y corregir respuesta.
3. **Pantalla de Resultados y Estadísticas:**
   - **Podio y Ranking completo de los 8 partidos** con barras de porcentaje animadas, color del partido, nombre del cabeza de lista en Baleares y % de cobertura programática.
   - **Indicador de Solidez del Resultado:** Muestra si el resultado se basa en 1 tanda (30 preg.), 2 tandas (60 preg.) o 3 tandas (90 preg.), junto con un botón destacado **"Afianzar resultado: Jugar siguiente tanda (+30 preguntas nuevas)"**.
   - **Desglose por los 8 Bloques Temáticos:** Qué partido coincide más contigo en Vivienda, cuál en Turismo, cuál en Inmigración, etc.
   - **Auditoría de Transparencia ("¿Por qué me sale este resultado?"):** Acordeón interactivo filtrable por partido o por bloque donde el usuario ve su respuesta frente a la postura de cada partido y lee la `cita` y `fuente` exacta del programa electoral.

---

## 8. Estructura de Carpetas del Proyecto
```text
/
├── SPEC.md
├── package.json
├── index.html
├── vite.config.ts
├── public/
│   └── data/
│       └── cuestionario.json
├── src/
│   ├── main.ts (o main.tsx si se usa React)
│   ├── types.ts
│   ├── engine/
│   │   └── affinity.ts        # Motor matemático puro y testeable
│   └── components/            # Pantallas Inicio, Pregunta, Resultados, Auditoría
└── pipeline/                  # Offline (ignorar PDFs en Git)
    ├── requirements.txt       # google-genai, pydantic, python-dotenv
    ├── pdfs/                  # Carpeta local para depositar los PDFs oficiales
    └── extract_programs.py    # Script que lee PDFs y actualiza public/data/cuestionario.json
```