import { describe, it, expect } from 'vitest';
import { validateInquiry } from './inquiry.js';

describe('validateInquiry', () => {
  it('returns empty array for valid minimal data', () => {
    expect(validateInquiry({ name: 'Alice', email: 'alice@example.com' })).toEqual([]);
  });

  it('returns error when name is missing', () => {
    const errors = validateInquiry({ name: '', email: 'a@b.com' });
    expect(errors).toContain('Name is required');
  });

  it('returns error when name is whitespace only', () => {
    const errors = validateInquiry({ name: '   ', email: 'a@b.com' });
    expect(errors).toContain('Name is required');
  });

  it('returns error when email is missing', () => {
    const errors = validateInquiry({ name: 'Bob', email: '' });
    expect(errors).toContain('Email is required');
  });

  it('returns error for invalid email format', () => {
    const errors = validateInquiry({ name: 'Bob', email: 'not-an-email' });
    expect(errors).toContain('Invalid email format');
  });

  it('returns multiple errors when both fields are missing', () => {
    const errors = validateInquiry({ name: '', email: '' });
    expect(errors.length).toBe(2);
  });

  it('accepts valid email with subdomains', () => {
    expect(validateInquiry({ name: 'Alice', email: 'a@sub.domain.com' })).toEqual([]);
  });
});
