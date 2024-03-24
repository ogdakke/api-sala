import { describe, it, expect } from 'vitest';

const MY_DOMAIN = "salasanakone";
const regexPattern = /^(salasanakone\.com|.+\.salasanakone\.pages\.dev)$/

describe('Domain Regex Tests', () => {
  it('should match the main domain', () => {
    const result = regexPattern.test(`${MY_DOMAIN}.com`);
    expect(result).toBe(true);
  });

  it('should match a subdomain of the main domain on pages.dev', () => {
    const result = regexPattern.test(`feature-branch.${MY_DOMAIN}.pages.dev`);
    expect(result).toBe(true);
  });

  it('should not match an unrelated domain', () => {
    const result = regexPattern.test('unrelateddomain.com');
    expect(result).toBe(false);
  });

  it('should not match a malformed domain', () => {
    const result = regexPattern.test(`${MY_DOMAIN}.malformed`);
    expect(result).toBe(false);
  });
});
