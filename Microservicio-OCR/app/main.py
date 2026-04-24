from fastapi import FastAPI, File, UploadFile
from app.services.ocr_processor import process_document_bytes
from app.services.invoice_parser import extract_invoice_fields
app = FastAPI(title="OCR Service", version="1.0.0")


@app.get("/health")
def health():
    return {"ok": True}


@app.post("/process")
async def process(file: UploadFile = File(...)):
    file_bytes = await file.read()

    result = process_document_bytes(
        file_bytes=file_bytes,
        filename=file.filename or "archivo",
        content_type=file.content_type or "application/octet-stream",
    )

    raw_text = result.rawText or ""

    parsed_result = extract_invoice_fields(raw_text)

    response = result.model_dump()

    response["success"] = parsed_result["success"]
    response["processStatus"] = parsed_result["processStatus"]
    response["confidenceAvg"] = parsed_result["confidenceAvg"]
    response["documentContext"] = parsed_result["documentContext"]
    response["normalizedFields"] = parsed_result["normalizedFields"]
    response["extraFields"] = parsed_result["extraFields"]
    response["items"] = parsed_result["items"]
    response["totals"] = parsed_result["totals"]

    return response