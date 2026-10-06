import logging
import time
import uuid

from fastapi import FastAPI, File, HTTPException, Request, UploadFile
from fastapi.responses import JSONResponse

from app.security import processing_access_status
from app.config import ALLOWED_MIME_TYPES, settings
from app.document_intelligence import DocumentIntelligenceEngine
from app.services.ocr_processor import process_document_bytes
app = FastAPI(title="OCR Service", version="1.0.0")
intelligence_engine = DocumentIntelligenceEngine()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)
logger = logging.getLogger("ocr.api")


@app.middleware("http")
async def request_logging(request: Request, call_next):
    if request.url.path.rstrip("/") == "/process":
        denied = processing_access_status(request.headers.get("x-ocr-api-key"))
        if denied:
            return JSONResponse(status_code=denied, content={"detail": "Procesamiento OCR no autorizado."})
    request_id = request.headers.get("x-request-id") or str(uuid.uuid4())
    started = time.perf_counter()
    try:
        response = await call_next(request)
    except Exception:
        logger.exception("ocr_request_unhandled request_id=%s", request_id)
        response = JSONResponse(status_code=500, content={"detail": "Error interno OCR."})
    response.headers["x-request-id"] = request_id
    logger.info(
        "ocr_request_completed request_id=%s method=%s path=%s status=%s duration_ms=%s",
        request_id, request.method, request.url.path, response.status_code,
        round((time.perf_counter() - started) * 1000),
    )
    return response


@app.get("/health")
def health():
    return {"ok": True}


@app.post("/process")
async def process(file: UploadFile = File(...)):
    file_bytes = await file.read()

    content_type = (file.content_type or "").split(";", 1)[0].lower()
    if content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(status_code=415, detail="Tipo de archivo no permitido.")
    if len(file_bytes) > settings.max_file_size_bytes:
        raise HTTPException(status_code=413, detail="El archivo excede el tamaño máximo permitido.")

    result = process_document_bytes(
        file_bytes=file_bytes,
        filename=file.filename or "archivo",
        content_type=file.content_type or "application/octet-stream",
    )

    raw_text = result.rawText or ""

    response = result.model_dump()

    if result.processStatus == "ERROR_OCR":
        response["success"] = False
        response["processStatus"] = "ERROR_OCR"
        return response

    interpreted = intelligence_engine.interpret(raw_text, result.confidenceAvg)
    response.update(interpreted.as_api_response())

    return response
