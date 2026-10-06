const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'); const s=fs.readFileSync('src/modules/settlements/settlements.service.ts','utf8');
test('numeración de liquidaciones usa lock transaccional',()=>{assert.match(s,/pg_advisory_xact_lock/);assert.match(s,/Serializable/);assert.doesNotMatch(s,/MAX\s*\(/);});
test('liquidación exige pago PAGADO',()=>assert.match(s,/payment\.paymentStatus !== 'PAGADO'/));
test('cierre y certificación son condicionales',()=>{assert.match(s,/ExpenseSettlement.*FOR UPDATE/);assert.match(s,/certificationStatus: 'PENDIENTE'/);});
test('reintegro concurrente se revalida dentro de transacción',()=>assert.match(s,/current\.refunds\.some/));
