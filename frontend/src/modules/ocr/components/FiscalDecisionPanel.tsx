import { Badge, Box, Grid, Heading, Stack, Text } from "@chakra-ui/react";
import type { OcrResultData } from "../../documents/services/documents.service";

const messages: Record<string, string> = {
  FACTURA_CONSUMIDOR_FINAL: "La factura no puede ser recibida porque está emitida a CONSUMIDOR FINAL (CF). Debe presentar un comprobante emitido a nombre de la empresa y con su NIT correspondiente.",
  NIT_RECEPTOR_NO_COINCIDE: "El NIT del receptor no coincide con el NIT de la empresa configurada.",
  NIT_NO_IDENTIFICADO: "No fue posible identificar el NIT del receptor. Se requiere revisión manual.",
  NIT_RECEPTOR_NO_REGISTRADO_MAESTRO: "NIT receptor no registrado en el Maestro Fiscal.",
  DOCUMENTO_PERTENECE_A_OTRA_EMPRESA: "El documento pertenece fiscalmente a otra empresa y no puede utilizarse en esta solicitud.",
  CONFIANZA_NIT_INSUFICIENTE: "El NIT fue identificado con baja confianza. Se requiere revisión manual.",
  DOCUMENTO_NO_PERMITIDO: "El documento no puede ser recibido porque su tipo no está autorizado por las políticas vigentes.",
};
const display = (value?: string | null) => value?.split("_").join(" ") || "-";

export function FiscalDecisionPanel({ ocr }: { ocr: OcrResultData }) {
  const decision = ocr.complianceDecisions?.[0]; if (!ocr.complianceResult) return null;
  const approved = ["VALIDACION_FISCAL_APROBADA", "DOCUMENTO_PERMITIDO_POR_POLITICA"].includes(ocr.complianceResult);
  const pending = ocr.complianceResult === "VALIDACION_FISCAL_PENDIENTE_REVISION"; const color = approved ? "green" : pending ? "yellow" : "red";
  return <Box borderWidth="1px" borderColor={`${color}.200`} bg={`${color}.50`} borderRadius="2xl" p="5"><Stack gap="4">
    <Box display="flex" justifyContent="space-between" gap="3"><Heading size="md">{ocr.finalVoucherType === "FACTURA" ? "Receptor fiscal" : "Tipo de documento"}</Heading><Badge colorPalette={color}>{display(ocr.complianceResult)}</Badge></Box>
    <Grid templateColumns={{ base: "1fr", md: "repeat(2,1fr)" }} gap="3"><Text><b>Tipo:</b> {ocr.finalVoucherType || "-"}</Text><Text><b>Tipo receptor:</b> {ocr.receiverType || "-"}</Text><Text><b>NIT receptor:</b> {ocr.receiverTaxId || "No identificado"}</Text><Text><b>Razón social:</b> {ocr.receiverName || "No identificada"}</Text><Text><b>Empresa Fiscal Detectada:</b> {ocr.fiscalCompany ? `${ocr.fiscalCompany.code} · ${ocr.fiscalCompany.legalName || ocr.fiscalCompany.name}` : "No identificada"}</Text><Text><b>Método:</b> {display(ocr.fiscalCompanyIdentificationMethod)}</Text><Text><b>Fecha de identificación:</b> {ocr.fiscalCompanyIdentifiedAt ? new Date(ocr.fiscalCompanyIdentifiedAt).toLocaleString() : "-"}</Text><Text><b>Confianza NIT:</b> {decision?.receiverConfidence == null ? "-" : `${Number(decision.receiverConfidence).toFixed(2)} %`}</Text></Grid>
    {ocr.fiscalCompanyWarning && <Text color="orange.700"><b>Advertencia:</b> La razón social extraída presenta diferencias respecto del Maestro Fiscal. Revise el dato; el NIT coincidente mantiene la identificación.</Text>}
    {decision?.appliedPolicyName && <Text><b>Política aplicada:</b> {decision.appliedPolicyName} ({decision.appliedPolicyCode})</Text>}
    <Text fontWeight="semibold">{messages[ocr.complianceReason || ""] || display(ocr.complianceReason)}</Text><Text fontSize="sm">Elegible para futura liquidación: <b>{ocr.eligibleForSettlement ? "SÍ" : "NO"}</b></Text>
    <Box as="details"><Box as="summary" cursor="pointer" fontWeight="semibold">Auditoría de decisiones</Box><Stack mt="3" gap="2">{ocr.complianceDecisions?.map(item => <Box key={item.id} borderWidth="1px" borderRadius="lg" p="3" bg="white"><Text>{display(item.result)} · {display(item.reason)}</Text><Text fontSize="xs" color="gray.500">{item.actorName} · {new Date(item.createdAt).toLocaleString()} · Regla: {item.appliedRule}</Text></Box>)}</Stack></Box>
  </Stack></Box>;
}
