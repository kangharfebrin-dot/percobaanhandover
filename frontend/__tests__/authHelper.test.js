import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  getDashboardRoute,
  normalizeRole,
  canManageAdminAndPengawas,
  canAccessOperationalManagement,
  canAccessAuditLog
} from '../utils/authHelper.js';

describe('authHelper - 4 Canonical Roles & getDashboardRoute', () => {
  it('returns SuperAdminDashboard for SUPER_ADMIN', () => {
    assert.strictEqual(getDashboardRoute('SUPER_ADMIN'), 'SuperAdminDashboard');
    assert.strictEqual(getDashboardRoute({ role: 'SUPER_ADMIN' }), 'SuperAdminDashboard');
  });

  it('returns AdminDashboard for ADMIN', () => {
    assert.strictEqual(getDashboardRoute('ADMIN'), 'AdminDashboard');
    assert.strictEqual(getDashboardRoute({ role: 'ADMIN' }), 'AdminDashboard');
  });

  it('returns PengawasDashboard for PENGAWAS', () => {
    assert.strictEqual(getDashboardRoute('PENGAWAS'), 'PengawasDashboard');
    assert.strictEqual(getDashboardRoute({ role: 'PENGAWAS' }), 'PengawasDashboard');
  });

  it('returns UserDashboard for AMT and legacy USER', () => {
    assert.strictEqual(getDashboardRoute('AMT'), 'UserDashboard');
    assert.strictEqual(getDashboardRoute('USER'), 'UserDashboard');
    assert.strictEqual(getDashboardRoute({ role: 'AMT' }), 'UserDashboard');
    assert.strictEqual(getDashboardRoute({ role: 'USER' }), 'UserDashboard');
  });

  it('rejects unknown or null roles by returning Login (no accidental AMT fallback)', () => {
    assert.strictEqual(getDashboardRoute(null), 'Login');
    assert.strictEqual(getDashboardRoute(undefined), 'Login');
    assert.strictEqual(getDashboardRoute('UNKNOWN_ROLE'), 'Login');
    assert.strictEqual(getDashboardRoute({ role: 'GUEST' }), 'Login');
  });

  it('normalizes roles correctly', () => {
    assert.strictEqual(normalizeRole('user'), 'AMT');
    assert.strictEqual(normalizeRole('USER'), 'AMT');
    assert.strictEqual(normalizeRole('super_admin'), 'SUPER_ADMIN');
    assert.strictEqual(normalizeRole('admin'), 'ADMIN');
    assert.strictEqual(normalizeRole('pengawas'), 'PENGAWAS');
    assert.strictEqual(normalizeRole('amt'), 'AMT');
    assert.strictEqual(normalizeRole(null), null);
  });

  it('verifies canManageAdminAndPengawas (hanya SUPER_ADMIN)', () => {
    assert.strictEqual(canManageAdminAndPengawas('SUPER_ADMIN'), true);
    assert.strictEqual(canManageAdminAndPengawas({ role: 'SUPER_ADMIN' }), true);
    assert.strictEqual(canManageAdminAndPengawas('ADMIN'), false);
    assert.strictEqual(canManageAdminAndPengawas('PENGAWAS'), false);
    assert.strictEqual(canManageAdminAndPengawas('AMT'), false);
  });

  it('verifies canAccessOperationalManagement (ADMIN & SUPER_ADMIN setara)', () => {
    assert.strictEqual(canAccessOperationalManagement('SUPER_ADMIN'), true);
    assert.strictEqual(canAccessOperationalManagement('ADMIN'), true);
    assert.strictEqual(canAccessOperationalManagement({ role: 'ADMIN' }), true);
    assert.strictEqual(canAccessOperationalManagement('PENGAWAS'), false);
    assert.strictEqual(canAccessOperationalManagement('AMT'), false);
  });

  it('verifies canAccessAuditLog (ADMIN & SUPER_ADMIN setara)', () => {
    assert.strictEqual(canAccessAuditLog('SUPER_ADMIN'), true);
    assert.strictEqual(canAccessAuditLog('ADMIN'), true);
    assert.strictEqual(canAccessAuditLog({ role: 'ADMIN' }), true);
    assert.strictEqual(canAccessAuditLog('PENGAWAS'), false);
    assert.strictEqual(canAccessAuditLog('AMT'), false);
  });
});

