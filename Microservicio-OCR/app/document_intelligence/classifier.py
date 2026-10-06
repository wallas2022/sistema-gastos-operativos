from .models import DocumentClassification
from .text import normalized


class DocumentClassifier:
    COUNTRY_RULES = {
        "GT": ("GUATEMALA", "FEL", "SAT", "DOCUMENTO TRIBUTARIO ELECTRONICO", "NUMERO DE AUTORIZACION"),
        "SV": ("EL SALVADOR", "TIPO DTE", "CODIGO DE GENERACION", "SELLO DE RECEPCION"),
        "HN": ("HONDURAS", "RTN", "CAI", "RANGO AUTORIZADO"),
        "NI": ("NICARAGUA", "RUC", "DGI", "CORDOBA"),
        "CR": ("COSTA RICA", "CEDULA JURIDICA", "CLAVE NUMERICA", "COMPROBANTE ELECTRONICO"),
    }
    TYPE_RULES = {
        "NOTA_CREDITO": ("NOTA DE CREDITO", "NOTA CREDITO"),
        "RECIBO": ("RECIBO", "RECIBI DE"),
        "FACTURA": ("FACTURA", "FEL", "DTE", "COMPROBANTE ELECTRONICO"),
    }

    def classify(self, text: str) -> DocumentClassification:
        source = normalized(text)
        country_scores = {code: sum(1 for key in keys if key in source) for code, keys in self.COUNTRY_RULES.items()}
        country = max(country_scores, key=country_scores.get) if any(country_scores.values()) else None
        type_scores = {kind: sum(1 for key in keys if key in source) for kind, keys in self.TYPE_RULES.items()}
        document_type = max(type_scores, key=type_scores.get) if any(type_scores.values()) else "DOCUMENTO"
        if "USD" in source or "US$" in source or "$" in text or country == "SV":
            currency_code, symbol = "USD", "$"
        elif "HNL" in source or "LEMPIRA" in source or country == "HN":
            currency_code, symbol = "HNL", "L"
        elif "NIO" in source or "CORDOBA" in source or country == "NI":
            currency_code, symbol = "NIO", "C$"
        elif "CRC" in source or "COLONES" in source or country == "CR":
            currency_code, symbol = "CRC", "₡"
        elif "GTQ" in source or "QUETZAL" in source or country == "GT" or "Q" in text:
            currency_code, symbol = "GTQ", "Q"
        else:
            currency_code, symbol = None, None
        evidence = country_scores.get(country, 0) + type_scores.get(document_type, 0) if country else type_scores.get(document_type, 0)
        confidence = min(99.0, 60.0 + evidence * 7.0)
        return DocumentClassification(
            document_type, country, currency_code, symbol,
            f"keyword_score:{country or 'unknown'}:{document_type}", confidence,
        )
