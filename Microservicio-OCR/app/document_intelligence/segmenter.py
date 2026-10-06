from .models import BlockType, DocumentBlock
from .text import normalized


class DocumentSegmenter:
    ANCHORS = (
        (BlockType.ISSUER, ("DATOS DEL EMISOR", "DATOS EMISOR", "EMISOR", "PROVEEDOR")),
        (BlockType.BUYER, ("DATOS DEL COMPRADOR", "DATOS DEL RECEPTOR", "COMPRADOR", "RECEPTOR", "CLIENTE")),
        (BlockType.DETAIL, ("DETALLE", "DESCRIPCION", "CANTIDAD", "PRODUCTO", "CONCEPTO")),
        (BlockType.TAXES, ("SUBTOTAL", "SUB-TOTAL", "IMPUESTO", "IVA", "TOTAL A PAGAR", "TOTAL")),
        (BlockType.FOOTER, ("DATOS DEL CERTIFICADOR", "CERTIFICADOR", "NUMERO DE AUTORIZACION", "SELLO DE RECEPCION", "CAE", "CAI")),
    )

    def segment(self, text: str) -> dict[BlockType, DocumentBlock]:
        blocks = {kind: DocumentBlock(kind) for kind in BlockType}
        current = BlockType.HEADER
        lines = [line.strip() for line in text.replace("\r", "\n").splitlines() if line.strip()]
        for index, line in enumerate(lines):
            canonical = normalized(line)
            if canonical.startswith("--- PAGINA"):
                continue
            for block_type, anchors in self.ANCHORS:
                if any(anchor in canonical for anchor in anchors):
                    # "TOTAL" only changes block when it is a label, not when embedded in a product.
                    if block_type != BlockType.TAXES or canonical.startswith(("SUBTOTAL", "SUB-TOTAL", "IVA", "IMPUESTO", "TOTAL")):
                        current = block_type
                        break
            block = blocks[current]
            if not block.lines:
                block.start_line = index
            block.lines.append(line)
            block.end_line = index
        blocks[BlockType.GENERAL] = DocumentBlock(BlockType.GENERAL, lines, 0, max(0, len(lines) - 1))
        return blocks
