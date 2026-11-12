import argparse
import json
import os
import sys
import time
from datetime import date
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
from google import genai
from google.genai import types
from pydantic import BaseModel, Field, field_validator

# Rutas base del proyecto
ROOT_DIR = Path(__file__).resolve().parent.parent
JSON_PATH = ROOT_DIR / "public" / "data" / "cuestionario.json"
PDFS_DIR = ROOT_DIR / "pipeline" / "pdfs"

PARTIDOS_VALIDOS = {"PP", "PSIB", "VOX", "ARAMES", "FO", "PACMA", "PCTE", "SALF"}


# =====================================================================
# 1. ESQUEMA PYDANTIC (STRUCTURED OUTPUTS)
# =====================================================================
class EvaluacionPregunta(BaseModel):
    pregunta_id: str = Field(
        description="ID exacto de la pregunta recibida (ej. 'viv_01', 'tur_02')."
    )
    valor: Optional[int] = Field(
        default=None,
        description=(
            "Postura del partido segun el PDF en escala Likert: "
            "-2 (Totalmente en contra), -1 (Mas bien en contra), "
            "0 (Neutral, ambiguo o con matices contradictorios), "
            "1 (Mas bien a favor), 2 (Totalmente a favor). "
            "Usa null (None) EXCLUSIVAMENTE si el documento no aborda el tema ni directa ni indirectamente."
        ),
    )
    cita: str = Field(
        description=(
            "Empieza con 1 frase neutra en espanol que inicie con 'Propone...' o 'Plantea...' (max 35 palabras, "
            "sin adjetivos propagandisticos del partido), seguida entre comillas de la cita literal del PDF "
            "(traducida fielmente al espanol si el original esta en catalan). "
            "Si valor es null, escribe exactamente: 'Sin mencion expresa en el programa analizado.'"
        )
    )
    fuente: str = Field(
        description=(
            "Nombre corto del documento y pagina exacta donde aparece la postura (ej. 'Programa PP 29N, pag. 42'). "
            "Si valor es null, escribe 'No especificado en el programa'."
        )
    )

    @field_validator("valor")
    @classmethod
    def validar_rango_likert(cls, v: Optional[int]) -> Optional[int]:
        if v is None:
            return None
        return max(-2, min(2, int(v)))


class ResultadoPartido(BaseModel):
    partido_id: str = Field(description="Identificador del partido evaluado.")
    evaluaciones: list[EvaluacionPregunta] = Field(
        description="Lista completa de todas las preguntas evaluadas."
    )


# =====================================================================
# 2. INSTRUCCIONES DEL SISTEMA PARA EL ANALISTA ELECTORAL
# =====================================================================
SYSTEM_INSTRUCTION = """
Eres un analista electoral neutral que extrae y evalua las posturas de los partidos politicos para un test de afinidad sobre las Elecciones Generales del 29N en Illes Balears. Todo lo que escribas se mostrara al publico junto al nombre del partido, por lo que la precision y la neutralidad son prioritarias.

REGLAS DE PUNTUACION ('valor' de -2 a +2 o null):
1. Evalua TODAS las preguntas de la lista respetando su 'pregunta_id' exacto.
2. Calibra el valor segun la FUERZA DEL VERBO del compromiso en el PDF:
   - +2 / -2: Compromiso firme y directo con mecanismo concreto ("aprobar", "prohibir", "derogar", "crear", "eliminar") totalmente a favor (+2) o en contra (-2) del enunciado.
   - +1 / -1: Compromiso parcial, gradual, condicionado o con verbos debiles ("impulsar", "promover", "estudiar", "avanzar hacia", "revisar", "fomentar").
   - 0: Posicion intermedia, ambigua o con medidas que chocan parcialmente con el enunciado.
   - null: El PDF solo contiene diagnosticos, criticas a otros partidos o logros del pasado sin un compromiso de futuro sobre este tema, o no lo menciona en absoluto. NUNCA inventes posturas por conocimiento general externo al PDF.

REGLAS DE REDACCION PARA EL CAMPO 'cita' (Evitar errores de extraccion):
1. Estructura en dos partes:
   - Primero, un resumen neutro de 1 frase que empiece SIEMPRE por "Propone..." o "Plantea..." (o "Rechaza..." si es -2), en espanol llano. No adoptes las palabras valorativas o cargadas del partido ("masificacion", "nefasta", "ley mordaza", "valiente", "chiringuito").
   - Segundo, entre comillas ("..."), copia la frase literal mas especifica del PDF donde figura el compromiso (1-2 oraciones completas, sin cortar a mitad de frase). Usa " […] " unicamente si el diseño a varias columnas del PDF interrumpe la oracion con un numero de pagina o titular.
2. Idioma: Si el programa original esta en catalan (ej. Ara Mes o PSIB), escribe tanto el resumen como la cita traducidos fielmente al espanol.
3. No añadas ningún dato en el resumen (cifras, plazos, quien lo gestiona) que no aparezca explícitamente en la cita literal.
4. En 'fuente', indica el nombre corto del documento y el numero exacto de pagina donde empieza la cita (ej. 'Programa PP 29N, pag. 42').
"""


# =====================================================================
# 3. FUNCIONES DE PROCESAMIENTO CON GEMINI FILE API
# =====================================================================
def construir_prompt_preguntas(partido_id: str, preguntas: list[dict]) -> str:
    lista_simplificada = [
        {
            "pregunta_id": p["id"],
            "bloque": p["bloque"],
            "enunciado": p["enunciado"],
            "contexto": p.get("contexto_opcional", ""),
        }
        for p in preguntas
    ]
    preguntas_json = json.dumps(lista_simplificada, ensure_ascii=False, indent=2)
    return (
        f"Analiza el documento PDF adjunto correspondiente al partido '{partido_id}'.\n"
        f"Determina su postura para cada una de las siguientes {len(preguntas)} afirmaciones:\n\n"
        f"{preguntas_json}"
    )


def procesar_pdf_partido(
    client: genai.Client,
    partido_id: str,
    pdf_path: Path,
    preguntas: list[dict],
    model_name: str,
) -> ResultadoPartido:
    print(f"[{partido_id}] Subiendo '{pdf_path.name}' a Gemini File API...")
    uploaded_file = client.files.upload(file=str(pdf_path))

    try:
        # Esperar si el PDF es muy pesado y sigue en estado PROCESSING
        while uploaded_file.state.name == "PROCESSING":
            print(f"[{partido_id}] Procesando archivo en Google Cloud, esperando 3s...")
            time.sleep(3)
            uploaded_file = client.files.get(name=uploaded_file.name)

        if uploaded_file.state.name != "ACTIVE":
            raise RuntimeError(
                f"Error al procesar el PDF en Gemini File API. Estado: {uploaded_file.state.name}"
            )

        print(f"[{partido_id}] Analizando {len(preguntas)} preguntas con {model_name}...")
        prompt = construir_prompt_preguntas(partido_id, preguntas)

        response = client.models.generate_content(
            model=model_name,
            contents=[uploaded_file, prompt],
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_INSTRUCTION,
                response_mime_type="application/json",
                response_schema=ResultadoPartido,
                temperature=0.0,
            ),
        )

        if response.parsed is not None:
            return response.parsed
        return ResultadoPartido.model_validate_json(response.text)

    finally:
        # Limpieza garantizada del archivo en la nube
        try:
            client.files.delete(name=uploaded_file.name)
            print(f"[{partido_id}] Archivo temporal eliminado de Gemini File API.")
        except Exception as e:
            print(f"[{partido_id}] Aviso: no se pudo borrar el archivo remoto: {e}")


# =====================================================================
# 4. ACTUALIZACION DEL JSON ESTATICO
# =====================================================================
def actualizar_cuestionario(
    data: dict,
    partido_id: str,
    resultado: ResultadoPartido,
    preserve_fallback: bool,
) -> tuple[int, int]:
    mapa_evaluaciones = {ev.pregunta_id: ev for ev in resultado.evaluaciones}
    actualizadas = 0
    silencios = 0

    for pregunta in data.get("preguntas", []):
        qid = pregunta["id"]
        if qid not in mapa_evaluaciones:
            print(f"  [!] Aviso: Gemini no devolvio evaluacion para '{qid}' en {partido_id}")
            continue

        ev = mapa_evaluaciones[qid]
        if "posturas" not in pregunta:
            pregunta["posturas"] = {}

        # Si el PDF no menciona el tema y se activo --preserve-fallback, mantenemos el dato previo
        if ev.valor is None and preserve_fallback and partido_id in pregunta["posturas"]:
            silencios += 1
            continue

        pregunta["posturas"][partido_id] = {
            "valor": ev.valor,
            "cita": ev.cita,
            "fuente": ev.fuente,
        }
        if ev.valor is None:
            silencios += 1
        else:
            actualizadas += 1

    return actualizadas, silencios


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Extrae posturas de PDFs electorales y actualiza public/data/cuestionario.json"
    )
    parser.add_argument(
        "--partido",
        type=str,
        help="Procesar solo un partido especifico (ej. PP, PSIB, VOX, ARAMES, FO, PACMA, PCTE, SALF).",
    )
    parser.add_argument(
        "--model",
        type=str,
        default="gemini-2.5-flash",
        help="Modelo de Gemini a utilizar (por defecto: gemini-2.5-flash). Usa gemini-2.5-pro para mayor precision.",
    )
    parser.add_argument(
        "--preserve-fallback",
        action="store_true",
        help="Si el PDF no menciona una pregunta (valor=null), conserva la postura previa del JSON en vez de sobreescribir con null.",
    )
    args = parser.parse_args()

    load_dotenv(ROOT_DIR / ".env")
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("ERROR: No se encontro la variable GEMINI_API_KEY en el archivo .env")
        sys.exit(1)

    if not JSON_PATH.exists():
        print(f"ERROR: No existe el archivo {JSON_PATH}")
        sys.exit(1)

    PDFS_DIR.mkdir(parents=True, exist_ok=True)

    with open(JSON_PATH, "r", encoding="utf-8") as f:
        cuestionario_data = json.load(f)

    preguntas = cuestionario_data.get("preguntas", [])
    if not preguntas:
        print("ERROR: El archivo cuestionario.json no contiene preguntas.")
        sys.exit(1)

    # Determinar que PDFs vamos a procesar
    if args.partido:
        pid = args.partido.upper()
        if pid not in PARTIDOS_VALIDOS:
            print(f"ERROR: Partido '{pid}' no valido. Usa uno de: { sorted(PARTIDOS_VALIDOS) }")
            sys.exit(1)
        pdf_file = PDFS_DIR / f"{pid}.pdf"
        if not pdf_file.exists():
            print(f"ERROR: No se encontro el archivo esperado en {pdf_file}")
            sys.exit(1)
        objetivos = [(pid, pdf_file)]
    else:
        objetivos = []
        for pid in sorted(PARTIDOS_VALIDOS):
            pdf_file = PDFS_DIR / f"{pid}.pdf"
            if pdf_file.exists():
                objetivos.append((pid, pdf_file))

    if not objetivos:
        print(
            f"No se encontraron archivos PDF en {PDFS_DIR}.\n"
            f"Coloca los programas con el ID del partido como nombre: "
            f"PP.pdf, PSIB.pdf, VOX.pdf, ARAMES.pdf, FO.pdf, PACMA.pdf, PCTE.pdf, SALF.pdf"
        )
        sys.exit(0)

    client = genai.Client(api_key=api_key)

    for partido_id, pdf_path in objetivos:
        print("-" * 60)
        resultado = procesar_pdf_partido(
            client=client,
            partido_id=partido_id,
            pdf_path=pdf_path,
            preguntas=preguntas,
            model_name=args.model,
        )
        actualizadas, silencios = actualizar_cuestionario(
            data=cuestionario_data,
            partido_id=partido_id,
            resultado=resultado,
            preserve_fallback=args.preserve_fallback,
        )
        print(
            f"[{partido_id}] Completado: {actualizadas} posturas definidas, "
            f"{silencios} silencios programaticos."
        )

    # Actualizar fecha de modificacion y guardar JSON
    cuestionario_data["metadata"]["ultima_actualizacion"] = date.today().isoformat()

    with open(JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(cuestionario_data, f, ensure_ascii=False, indent=2)

    print("-" * 60)
    print(f"Archivo actualizado correctamente en: {JSON_PATH}")


if __name__ == "__main__":
    main()