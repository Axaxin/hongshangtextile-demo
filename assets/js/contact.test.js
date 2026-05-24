import { describe, it, expect } from 'vitest';
import { validateContactForm } from './contact.js';

describe('validateContactForm', () => {
  it('returns no errors for valid data', () => {
    const errs = validateContactForm({ name: 'Alice', email: 'alice@example.com' });
    expect(errs).toEqual({});
  });

  it('requires name', () => {
    const errs = validateContactForm({ name: '', email: 'a@b.com' });
    expect(errs.name).toBeTruthy();
  });

  it('rejects whitespace-only name', () => {
    const errs = validateContactForm({ name: '   ', email: 'a@b.com' });
    expect(errs.name).toBeTruthy();
  });

  it('requires email', () => {
    const errs = validateContactForm({ name: 'Bob', email: '' });
    expect(errs.email).toBeTruthy();
  });

  it('rejects invalid email format', () => {
    const errs = validateContactForm({ name: 'Bob', email: 'notanemail' });
    expect(errs.email).toBeTruthy();
  });

  it('accepts valid email', () => {
    const errs = validateContactForm({ name: 'Bob', email: 'bob@corp.io' });
    expect(errs.email).toBeUndefined();
  });
});
