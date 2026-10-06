from .models import BlockType, FieldDefinition, TemplateDefinition


def _field(name, label, block, aliases, value_type="text", required=False):
    return FieldDefinition(name, label, block, tuple(aliases), value_type, required=required)


GENERIC_FIELDS = (
    _field("issuer_name", "Emisor", BlockType.ISSUER, ("RAZON SOCIAL", "NOMBRE EMISOR", "EMISOR"), required=True),
    _field("issuer_nit", "NIT emisor", BlockType.ISSUER, ("NIT", "RTN", "RUC", "CEDULA JURIDICA"), "identifier"),
    _field("buyer_name", "Comprador", BlockType.BUYER, ("NOMBRE", "RAZON SOCIAL", "CLIENTE", "RECEPTOR")),
    _field("buyer_nit", "NIT comprador", BlockType.BUYER, ("NIT", "RTN", "RUC", "CEDULA JURIDICA"), "identifier"),
    _field("series", "Serie", BlockType.HEADER, ("SERIE",)),
    _field("dte_number", "Numero de documento", BlockType.HEADER, ("NUMERO DTE", "NO. DTE", "NUMERO DE DOCUMENTO", "FACTURA NO")),
    _field("invoice_date", "Fecha", BlockType.HEADER, ("FECHA DE EMISION", "FECHA EMISION", "FECHA"), "date"),
    _field("authorization_number", "Numero de autorizacion", BlockType.FOOTER, ("NUMERO DE AUTORIZACION", "AUTORIZACION", "CODIGO DE GENERACION", "CAE", "CAI")),
    _field("certifier_name", "Certificador", BlockType.FOOTER, ("NOMBRE CERTIFICADOR", "CERTIFICADOR")),
    _field("certifier_nit", "NIT certificador", BlockType.FOOTER, ("NIT CERTIFICADOR", "NIT", "RTN"), "identifier"),
    _field("subtotal", "Subtotal", BlockType.TAXES, ("SUBTOTAL", "SUB-TOTAL"), "amount"),
    _field("tax", "Impuesto", BlockType.TAXES, ("IVA", "IMPUESTO", "ISV"), "amount"),
    _field("total", "Total", BlockType.TAXES, ("TOTAL A PAGAR", "GRAN TOTAL", "TOTAL"), "amount", required=True),
)


class TemplateResolver:
    def __init__(self, templates=None):
        self.templates = tuple(templates or (
            TemplateDefinition("GT_FACTURA_V1", "GT", "FACTURA", ("FACTURA ELECTRONICA", "DTE"), GENERIC_FIELDS),
            TemplateDefinition("GENERIC_FACTURA_V1", None, "FACTURA", ("FACTURA", "INVOICE"), GENERIC_FIELDS),
            TemplateDefinition("GENERIC_DOCUMENT_V1", None, "DOCUMENTO", (), GENERIC_FIELDS),
        ))

    def resolve(self, classification):
        exact = next((t for t in self.templates if t.country == classification.country and t.document_type == classification.document_type), None)
        if exact:
            return exact
        return next((t for t in self.templates if t.country is None and t.document_type == classification.document_type), self.templates[-1])
