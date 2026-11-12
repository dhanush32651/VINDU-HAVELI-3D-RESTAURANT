import test from 'node:test';
import assert from 'node:assert/strict';
import { freshDb, NOW } from './helpers';
import { signup, login, createSession, userFromToken, destroySession, findUser, ownerResetPassword } from '@/lib/services/auth';
import { hashPassword, verifyPassword, passwordProblem } from '@/lib/password';
import { bootstrapOwner } from '@/lib/bootstrap';

const good = { name: 'Asha Rao', email: 'Asha@Example.com', phone: '98765 43210', password: 'Secret123', accountType: 'customer' };

test('password hashing: salted, verifiable, rejects wrong password', () => {
  const h = hashPassword('Secret123'); assert.notEqual(h, hashPassword('Secret123'));
  assert.ok(verifyPassword('Secret123', h)); assert.ok(!verifyPassword('secret123', h)); assert.ok(!h.includes('Secret123'));
  assert.ok(passwordProblem('short1')); assert.ok(passwordProblem('allletters')); assert.equal(passwordProblem('Secret123'), null);
});
test('signup stores hashed password, normalises email/phone, account is usable immediately (no OTP)', () => {
  const db = freshDb(); const { user } = signup(db, good, NOW);
  assert.equal(user.role, 'customer'); assert.equal(user.email, 'asha@example.com'); assert.equal(user.phone, '9876543210');
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id); assert.ok(row.password_hash.startsWith('scrypt$')); assert.equal(row.verified, 1);
  assert.throws(() => signup(db, good, NOW), /already exists/);
  assert.throws(() => signup(db, { ...good, email: 'b@example.com' }, NOW), /phone/);
  assert.throws(() => signup(db, { ...good, email: 'c@example.com', phone: '9123456789', password: 'weak' }, NOW), /8 characters/);
});
test('customers cannot self-register as owner; owner needs the secret invitation code', () => {
  const db = freshDb(); delete process.env.OWNER_INVITE_CODE;
  assert.throws(() => signup(db, { ...good, accountType: 'owner' }, NOW), /disabled/);
  process.env.OWNER_INVITE_CODE = 'ROYAL-INVITE-42';
  assert.throws(() => signup(db, { ...good, accountType: 'owner' }, NOW), /Invalid owner invitation/);
  assert.throws(() => signup(db, { ...good, accountType: 'owner', inviteCode: 'guess' }, NOW), /Invalid owner invitation/);
  assert.equal(signup(db, { ...good, accountType: 'owner', inviteCode: 'ROYAL-INVITE-42' }, NOW).user.role, 'owner');
  assert.equal(signup(db, { ...good, email: 'x@example.com', phone: '9111111111', role: 'owner' }, NOW).user.role, 'customer');
  delete process.env.OWNER_INVITE_CODE;
});
test('login by email or phone; wrong password fails; sessions expire and can be destroyed', () => {
  const db = freshDb(); const { user } = signup(db, good, NOW);
  assert.throws(() => login(db, 'asha@example.com', 'wrong'), /Incorrect/); assert.throws(() => login(db, 'nobody@example.com', 'Secret123'), /Incorrect/);
  assert.equal(login(db, 'ASHA@example.com', 'Secret123').user.id, user.id); assert.equal(login(db, '+91 9876543210', 'Secret123').user.id, user.id);
  const s = createSession(db, user.id, NOW);
  assert.equal(userFromToken(db, s.token, NOW + 1000)?.id, user.id);
  assert.equal(userFromToken(db, s.token, NOW + 8 * 86400_000), null); assert.equal(userFromToken(db, 'forged', NOW), null);
  assert.ok(!JSON.stringify(db.prepare('SELECT * FROM sessions').all()).includes(s.token));
  destroySession(db, s.token); assert.equal(userFromToken(db, s.token, NOW), null);
});
test('owner-assisted password reset signs the customer out everywhere', () => {
  const db = freshDb(); const { user } = signup(db, good, NOW); const s = createSession(db, user.id, NOW);
  assert.throws(() => ownerResetPassword(db, user.email, 'short'), /8 characters/); assert.throws(() => ownerResetPassword(db, 'no@one.com', 'NewPass123'), /No account/);
  ownerResetPassword(db, '9876543210', 'NewPass123');
  assert.ok(login(db, user.email, 'NewPass123')); assert.throws(() => login(db, user.email, 'Secret123'), /Incorrect/); assert.equal(userFromToken(db, s.token, NOW + 1), null);
});
test('owner can be created from OWNER_EMAIL/OWNER_PASSWORD (idempotent)', () => {
  const db = freshDb(); process.env.OWNER_EMAIL = 'Owner@Haveli.com'; process.env.OWNER_PASSWORD = 'OwnerPass99';
  bootstrapOwner(db); bootstrapOwner(db);
  assert.equal(db.prepare("SELECT COUNT(*) c FROM users WHERE role = 'owner'").get().c, 1);
  assert.equal(login(db, 'owner@haveli.com', 'OwnerPass99').user.role, 'owner'); assert.ok(findUser(db, 'owner@haveli.com'));
  delete process.env.OWNER_EMAIL; delete process.env.OWNER_PASSWORD;
});
