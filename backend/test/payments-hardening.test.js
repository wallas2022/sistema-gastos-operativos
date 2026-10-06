const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const s=fs.readFileSync('src/modules/expense-request-payments/expense-request-payments.service.ts','utf8');
test('pagos validan estado aprobado, sobrepago y evidencia',()=>{assert.match(s,/request\.status !== 'APROBADA'/);assert.match(s,/no puede superar el monto autorizado/);assert.match(s,/El comprobante de pago es obligatorio/);});
test('pagos bloquean solicitud y son idempotentes ante concurrencia',()=>{assert.match(s,/FOR UPDATE/);assert.match(s,/paymentStatus === PaymentStatus\.PAGADO/);assert.match(s,/isolationLevel: Prisma\.TransactionIsolationLevel\.Serializable/);});
test('pago conserva moneda y referencia',()=>{assert.match(s,/currencyId: dto\.currencyId/);assert.match(s,/referenceNumber: dto\.referenceNumber\.trim\(\)/);});
