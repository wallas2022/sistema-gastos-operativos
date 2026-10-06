class RuleValidator:
    def validate(self, fields, items, totals, optical_confidence):
        messages = []
        names = {field.name for field in fields}
        if "issuer_name" not in names:
            messages.append("No se identifico el emisor en su bloque documental.")
        if "total" not in names:
            messages.append("No se identifico el total en el bloque de impuestos.")
        if totals["subtotal"] is not None and totals["tax"] is not None and totals["total"] is not None:
            if abs(totals["subtotal"] + totals["tax"] - totals["total"]) > 0.02:
                messages.append("Subtotal mas impuesto no coincide con el total.")
        evidence = len(fields) + len(items)
        if evidence == 0:
            return False, "ERROR_OCR", messages, optical_confidence
        status = "PROCESADO" if "total" in names and ("issuer_name" in names or "issuer_nit" in names) else "PENDIENTE_REVISION"
        confidence = sum([f.confidence for f in fields] + [i["confidence"] for i in items]) / evidence
        return True, status, messages, confidence
