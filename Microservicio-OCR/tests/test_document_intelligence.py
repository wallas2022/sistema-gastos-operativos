from app.document_intelligence import DocumentIntelligenceEngine
from app.document_intelligence.classifier import DocumentClassifier
from app.document_intelligence.models import BlockType, FieldDefinition, TemplateDefinition
from app.document_intelligence.segmenter import DocumentSegmenter
from app.document_intelligence.templates import TemplateResolver


SAMPLE = """FACTURA ELECTRONICA FEL
Fecha de emision: 10/08/2026
Datos del emisor
Razon social: Proveedor Uno
NIT: 1234567-8
Datos del comprador
Nombre: Empresa Compradora
NIT: 9876543-1
Detalle
Cantidad Descripcion Precio Total
1 Servicio de transporte 100.00 100.00
Historial de autorizaciones 1 99.00
Subtotal: Q 89.29
IVA: Q 10.71
Total a pagar: Q 100.00
Datos del certificador
Certificador: Certificador FEL
NIT: 5555555-5
Numero de autorizacion: ABC-123
"""


def test_classifier_and_segmenter_detect_context():
    classification = DocumentClassifier().classify(SAMPLE)
    blocks = DocumentSegmenter().segment(SAMPLE)
    assert classification.document_type == "FACTURA"
    assert classification.country == "GT"
    assert classification.currency_code == "GTQ"
    assert "1234567-8" in blocks[BlockType.ISSUER].text
    assert "9876543-1" in blocks[BlockType.BUYER].text
    assert "5555555-5" in blocks[BlockType.FOOTER].text


def test_engine_distinguishes_nits_and_ignores_detail_headers_and_history():
    result = DocumentIntelligenceEngine().interpret(SAMPLE, 94.5)
    values = {field.name: field for field in result.fields}
    assert values["issuer_nit"].normalized_value == "1234567-8"
    assert values["buyer_nit"].normalized_value == "9876543-1"
    assert values["certifier_nit"].normalized_value == "5555555-5"
    assert values["issuer_nit"].block == BlockType.ISSUER
    assert len(result.items) == 1
    assert result.items[0]["description"] == "Servicio de transporte"
    assert result.totals["total"] == 100.0
    assert result.process_status == "PROCESADO"


def test_api_contract_contains_field_audit_and_real_confidence():
    response = DocumentIntelligenceEngine().interpret(SAMPLE, 91.25).as_api_response()
    assert response["success"] is True
    assert response["normalizedFields"]
    assert response["normalizedFields"][0]["sourceBlock"]
    assert response["normalizedFields"][0]["extractionRule"].startswith("CONTEXT_ALIAS")
    assert response["normalizedFields"][0]["confidence"] == 91.25
    assert set(("documentContext", "normalizedFields", "extraFields", "items", "totals")) <= response.keys()


def test_template_resolver_supports_aliases_and_dynamic_fields():
    custom = TemplateDefinition(
        "CUSTOM_RECEIPT_V1", None, "RECIBO", ("COMPROBANTE",),
        (FieldDefinition("custom_reference", "Referencia", BlockType.HEADER, ("REFERENCIA INTERNA",)),),
    )
    resolver = TemplateResolver((custom,))
    engine = DocumentIntelligenceEngine(resolver=resolver)
    result = engine.interpret("RECIBO\nReferencia interna: REF-77", 88.0)
    assert result.template_id == "CUSTOM_RECEIPT_V1"
    assert result.fields[0].name == "custom_reference"
    assert result.fields[0].normalized_value == "REF-77"


def test_no_interpretable_evidence_is_error_not_pending_review():
    result = DocumentIntelligenceEngine().interpret("texto sin estructura", 70.0)
    assert result.success is False
    assert result.process_status == "ERROR_OCR"
