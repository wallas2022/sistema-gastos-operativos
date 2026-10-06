FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    OCR_MAX_FILE_SIZE_MB=20 \
    OCR_MAX_IMAGE_PIXELS=40000000 \
    OCR_MAX_IMAGE_SIDE=3000 \
    OCR_RETRY_IMAGE_SIDE=2200 \
    OCR_MAX_PDF_PAGES=25 \
    OCR_PDF_RENDER_DPI=200 \
    OCR_ALLOWED_MIME_TYPES=application/pdf,image/jpeg,image/png,image/webp,image/tiff,text/plain \
    FLAGS_use_mkldnn=0 \
    PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK=True

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends libgomp1 libgl1 libglib2.0-0 curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./
RUN python -m pip install --upgrade pip && pip install -r requirements.txt

RUN useradd --create-home --uid 10001 ocr && chown -R ocr:ocr /app
USER ocr

# Descarga los modelos durante la construcción para que la ejecución no dependa
# de conectividad externa y falle temprano si los artefactos no están disponibles.
RUN python -c "from paddleocr import PaddleOCR; PaddleOCR(lang='es', use_doc_orientation_classify=False, use_doc_unwarping=False, use_textline_orientation=False, enable_mkldnn=False)"

COPY --chown=ocr:ocr app ./app

EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --start-period=120s --retries=3 \
  CMD curl --fail http://127.0.0.1:8000/health || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
