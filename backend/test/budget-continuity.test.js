const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const reservation = fs.readFileSync('src/modules/budget/budget-reservation.service.ts','utf8');
const importer = fs.readFileSync('src/modules/budget/budget-import.service.ts','utf8');

test('reserva presupuestaria usa transacción serializable y bloquea partida/período', () => {
  assert.match(reservation, /repository\.transaction/);
  assert.match(reservation, /FOR UPDATE/);
  assert.match(reservation, /status === BudgetReservationStatus\.RESERVED \|\| item\.status === BudgetReservationStatus\.EXECUTED/);
});
test('reserva repetida es idempotente y reutiliza fila liberada', () => {
  assert.match(reservation, /if \(active\) return existing/);
  assert.match(reservation, /status === BudgetReservationStatus\.RELEASED/);
  assert.match(reservation, /status: BudgetReservationStatus\.RESERVED/);
});
test('reconcile ajusta únicamente la diferencia del importe', () => {
  assert.match(reservation, /const delta = newAmount\.minus\(oldAmount\)/);
  assert.match(reservation, /PRESUPUESTO_RESERVA_AUMENTADA/);
  assert.match(reservation, /PRESUPUESTO_RESERVA_REDUCIDA/);
});
test('resubmit reconcilia presupuesto antes de reiniciar aprobación', () => {
  const source = fs.readFileSync('src/modules/expense-requests/expense-requests.service.ts','utf8');
  assert.match(source, /budgetReservations\.reconcile\(id\)/);
});
test('versionado conserva reservas activas en líneas equivalentes', () => {
  assert.match(importer, /Carry active reservations/);
  assert.match(importer, /budgetReservation\.update/);
  assert.match(importer, /expenseRequest\.updateMany/);
});

test('versionado bloquea reservas activas sin correspondencia', () => {
  assert.match(importer, /reservas activas sin partida equivalente/);
  assert.match(importer, /activeReservations/);
});
