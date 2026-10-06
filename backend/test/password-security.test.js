const test = require('node:test');
const assert = require('node:assert/strict');
const { validatePasswordPolicy, createResetToken, hashResetToken } = require('../dist/src/modules/auth/password-security');

test('genera tokens criptográficos distintos y almacena sólo su hash', () => {
  const first = createResetToken(), second = createResetToken();
  assert.equal(first.length, 64); assert.notEqual(first, second);
  assert.notEqual(hashResetToken(first), first); assert.equal(hashResetToken(first), hashResetToken(first));
});

test('acepta una contraseña que cumple la política configurable', () => {
  assert.doesNotThrow(() => validatePasswordPolicy('Segura1234*', 10, true));
});

test('rechaza contraseña corta', () => {
  assert.throws(() => validatePasswordPolicy('Aa1*', 10, true), /al menos 10/);
});

test('rechaza contraseña sin complejidad', () => {
  assert.throws(() => validatePasswordPolicy('sololetraslargas', 10, true), /mayúscula/);
});

test('permite desactivar complejidad conservando longitud', () => {
  assert.doesNotThrow(() => validatePasswordPolicy('frase suficientemente larga', 10, false));
});
