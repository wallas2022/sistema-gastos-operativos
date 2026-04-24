import { Box, Button, Heading, HStack, Input, Stack, Text } from '@chakra-ui/react'
import { useEffect, useState } from 'react'

interface FieldItem {
  id: string
  fieldName: string
  finalValue?: string
  detectedValue?: string
}

interface Props {
  fields: FieldItem[]
  onSave: (fields: FieldItem[]) => Promise<void>
  onConfirm: () => Promise<void>
}

export default function OcrFieldsEditor({ fields, onSave, onConfirm }: Props) {
  const [localFields, setLocalFields] = useState<FieldItem[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setLocalFields(fields)
  }, [fields])

  const updateField = (id: string, value: string) => {
    setLocalFields((current) =>
      current.map((field) => (field.id === id ? { ...field, finalValue: value } : field)),
    )
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave(localFields)
    } finally {
      setSaving(false)
    }
  }

  const handleConfirm = async () => {
    setSaving(true)
    try {
      await onConfirm()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Box bg="white" p={6} borderRadius="xl" boxShadow="sm">
      <Stack gap={4}>
        <Heading size="xl">Campos extraídos</Heading>
        {localFields.map((field) => (
          <Box key={field.id} borderWidth="1px" borderColor="gray.200" borderRadius="lg" p={4}>
            <Stack gap={2}>
              <Text fontWeight="bold">{field.fieldName}</Text>
              <Text color="gray.600">Detectado: {field.detectedValue || '-'}</Text>
              <Input
                value={field.finalValue || ''}
                onChange={(e) => updateField(field.id, e.target.value)}
                placeholder="Valor final"
              />
            </Stack>
          </Box>
        ))}
        <HStack>
          <Button colorPalette="blue" onClick={handleSave} loading={saving}>
            Guardar cambios
          </Button>
          <Button colorPalette="green" variant="outline" onClick={handleConfirm} loading={saving}>
            Confirmar OCR
          </Button>
        </HStack>
      </Stack>
    </Box>
  )
}
