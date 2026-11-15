import test from 'node:test';
import assert from 'node:assert/strict';
import {
  authenticateRoleLogin,
  ROLE_LOGIN_PORTALS,
  validateNumericPassword,
} from './authRoles';

test('defines all 5 construction role login portals starting with Manager', () => {
  assert.equal(ROLE_LOGIN_PORTALS.length, 5);
  const ids = ROLE_LOGIN_PORTALS.map((p) => p.id);
  assert.deepEqual(ids, [
    'manager',
    'project-manager',
    'site-manager',
    'site-supervisor',
    'accountant',
  ]);
});

test('validateNumericPassword accepts any numeric digits and rejects non-numeric input', () => {
  assert.equal(validateNumericPassword('0').valid, true);
  assert.equal(validateNumericPassword('1234').valid, true);
  assert.equal(validateNumericPassword('987654321').valid, true);

  assert.equal(validateNumericPassword('').valid, false);
  assert.equal(validateNumericPassword('   ').valid, false);
  assert.equal(validateNumericPassword('12a4').valid, false);
  assert.equal(validateNumericPassword('pass123').valid, false);
});

test('authenticateRoleLogin creates role-specific sessions for all 5 portals with numeric passwords', () => {
  const mg = authenticateRoleLogin({
    portalId: 'manager',
    identifier: 'MG-001',
    password: '007',
  });
  assert.equal(mg.ok, true);
  if (mg.ok) {
    assert.equal(mg.session.userRole, 'Manager');
    assert.equal(mg.session.defaultModule, 'dashboard');
  }

  const pm = authenticateRoleLogin({
    portalId: 'project-manager',
    identifier: 'PM-101',
    password: '42',
  });
  assert.equal(pm.ok, true);
  if (pm.ok) {
    assert.equal(pm.session.userRole, 'Project Manager');
    assert.equal(pm.session.defaultModule, 'projects');
  }

  const sm = authenticateRoleLogin({
    portalId: 'site-manager',
    identifier: 'SM-204',
    password: '999',
  });
  assert.equal(sm.ok, true);
  if (sm.ok) {
    assert.equal(sm.session.userRole, 'Site Manager');
    assert.equal(sm.session.defaultModule, 'dashboard');
  }

  const ss = authenticateRoleLogin({
    portalId: 'site-supervisor',
    identifier: 'SS-309',
    password: '7777',
  });
  assert.equal(ss.ok, true);
  if (ss.ok) {
    assert.equal(ss.session.userRole, 'Site Supervisor');
    assert.equal(ss.session.defaultModule, 'daily-reports');
  }

  const ac = authenticateRoleLogin({
    portalId: 'accountant',
    identifier: 'AC-412',
    password: '0011',
  });
  assert.equal(ac.ok, true);
  if (ac.ok) {
    assert.equal(ac.session.userRole, 'Accountant');
    assert.equal(ac.session.defaultModule, 'budget');
  }

  const badPw = authenticateRoleLogin({
    portalId: 'manager',
    identifier: 'MG-001',
    password: 'abc',
  });
  assert.equal(badPw.ok, false);
});
