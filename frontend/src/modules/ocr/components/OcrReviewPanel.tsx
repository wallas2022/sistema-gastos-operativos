import { Badge, Box, Grid, Heading, Input, Stack, Text } from "@chakra-ui/react";
import type { OcrField } from "../../documents/services/documents.service";

const groups = [
  { title: "Informacion del emisor", fields: ["issuer_name", "issuer_nit", "issuer_address"] },
  { title: "Informacion del documento", fields: ["series", "dte_number", "authorization_number", "invoice_date"] },
  { title: "Informacion del comprador", fields: ["buyer_name", "buyer_trade_name", "buyer_nit"] },
  { title: "Informacion tributaria", fields: ["subtotal", "tax", "other_taxes", "total"] },
];

const labels: Record<string, string> = { issuer_name: "Empresa", issuer_nit: "NIT", issuer_address: "Direccion", series: "Serie", dte_number: "Numero", authorization_number: "UUID / Autorizacion", invoice_date: "Fecha", buyer_name: "Razon social", buyer_trade_name: "Nombre comercial", buyer_nit: "NIT", subtotal: "Subtotal", tax: "IVA", other_taxes: "Otros impuestos", total: "Total" };

function Confidence({ value }: { value?: number | string | null }) {
  const confidence = Number(value ?? 0);
  const color = confidence >= 95 ? "green" : confidence >= 80 ? "yellow" : "red";
  return <Badge colorPalette={color}>{confidence.toFixed(2)} %</Badge>;
}

export function OcrReviewPanel({ fields, disabled, onChange }: { fields: OcrField[]; disabled: boolean; onChange: (id: string, value: string) => void }) {
  const rendered = new Set<string>();
  const renderField = (field: OcrField) => {
    rendered.add(field.id);
    return <Box key={field.id} borderWidth="1px" borderRadius="xl" p="4">
      <Stack gap="2">
        <Box display="flex" justifyContent="space-between" gap="3"><Text fontWeight="bold">{labels[field.fieldName] || field.rawLabel || field.fieldName}</Text><Confidence value={field.confidence}/></Box>
        <Text fontSize="sm" color="gray.500">Valor OCR: {field.detectedValue || "-"}</Text>
        {field.fieldName === "document_type" ? <select value={field.finalValue ?? "OTRO"} onChange={(event) => onChange(field.id, event.target.value)} disabled={disabled} style={{ border: "1px solid #d1d5db", borderRadius: 8, padding: 8 }}>{["FACTURA","RECIBO","COMPROBANTE_DE_PAGO","NOTA_DE_CREDITO","NOTA_DE_DEBITO","OTRO"].map(value => <option key={value}>{value}</option>)}</select> : <Input value={field.finalValue ?? ""} onChange={(event) => onChange(field.id, event.target.value)} disabled={disabled}/>} 
      </Stack>
    </Box>;
  };
  return <Stack gap="5">
    {groups.map(group => { const values = fields.filter(field => group.fields.includes(field.fieldName)); if (!values.length) return null; return <Box key={group.title}><Heading size="sm" mb="3">{group.title}</Heading><Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap="3">{values.map(renderField)}</Grid></Box>; })}
    {fields.some(field => !rendered.has(field.id)) && <Box><Heading size="sm" mb="3">Otros campos detectados</Heading><Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap="3">{fields.filter(field => !rendered.has(field.id)).map(renderField)}</Grid></Box>}
    <Box as="details" borderWidth="1px" borderRadius="xl" p="4"><Box as="summary" cursor="pointer" fontWeight="bold">Auditoria de extraccion y modificaciones</Box><Box overflowX="auto" mt="4"><Box as="table" width="100%" fontSize="sm"><Box as="thead"><Box as="tr">{["Campo","Valor detectado","Valor confirmado","Bloque","Regla","Confianza","Usuario / fecha"].map(title => <Box as="th" textAlign="left" p="2" key={title}>{title}</Box>)}</Box></Box><Box as="tbody">{fields.map(field => <Box as="tr" key={field.id}><Box as="td" p="2">{labels[field.fieldName] || field.fieldName}</Box><Box as="td" p="2">{field.detectedValue || "-"}</Box><Box as="td" p="2">{field.finalValue || "-"}</Box><Box as="td" p="2">{field.sourceBlock || "-"}</Box><Box as="td" p="2">{field.extractionRule || "-"}</Box><Box as="td" p="2"><Confidence value={field.confidence}/></Box><Box as="td" p="2">{field.corrections?.[0] ? `${field.corrections[0].user.name} · ${new Date(field.corrections[0].createdAt).toLocaleString()}` : "Sin modificaciones"}</Box></Box>)}</Box></Box></Box></Box>
  </Stack>;
}
