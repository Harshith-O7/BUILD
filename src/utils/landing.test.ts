import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  LANDING_SHOWCASE_SITES,
  LANDING_TEAM_MEMBERS,
  resolveSurfaceView,
} from './landing.ts';

describe('landing module structure & route resolution', () => {
  it('provides 1 featured site plus 3 strip sites (4 showcase projects total)', () => {
    assert.equal(LANDING_SHOWCASE_SITES.length, 4);
    const featured = LANDING_SHOWCASE_SITES.filter((s) => s.featured);
    assert.equal(featured.length, 1);
  });

  it('provides exactly 4 team engineers with names, roles, and portrait paths', () => {
    assert.equal(LANDING_TEAM_MEMBERS.length, 4);
    LANDING_TEAM_MEMBERS.forEach((member) => {
      assert.ok(member.name.length > 0);
      assert.ok(member.role.length > 0);
      assert.ok(member.imageUrl.startsWith('/src/assets/images/'));
    });
  });

  it('routes directly to login without an active session and to workspace when authenticated', () => {
    assert.equal(
      resolveSurfaceView({ hash: '', search: '', hasRoleSession: false }),
      'login'
    );
    assert.equal(
      resolveSurfaceView({ hash: '#landing', search: '', hasRoleSession: false }),
      'login'
    );
    assert.equal(
      resolveSurfaceView({ hash: '#login/accountant', search: '', hasRoleSession: false }),
      'login'
    );
    assert.equal(
      resolveSurfaceView({ hash: '', search: '?autostart=1', hasRoleSession: false }),
      'workspace'
    );
    assert.equal(
      resolveSurfaceView({ hash: '', search: '', hasRoleSession: true }),
      'workspace'
    );
  });
});
