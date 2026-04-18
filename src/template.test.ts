import { parseTemplate, validateEnvAgainstTemplate, generateTemplateFromEnv } from './template';

describe('parseTemplate', () => {
  it('parses keys from template', () => {
    const content = 'DB_HOST=\nDB_PORT=\n';
    const result = parseTemplate(content);
    expect(result.keys).toEqual(['DB_HOST', 'DB_PORT']);
  });

  it('marks keys with empty values as required', () => {
    const content = 'API_KEY=\nDEBUG=false\n';
    const result = parseTemplate(content);
    expect(result.required).toContain('API_KEY');
    expect(result.required).not.toContain('DEBUG');
  });

  it('captures descriptions from preceding comments', () => {
    const content = '# The database host\nDB_HOST=\n';
    const result = parseTemplate(content);
    expect(result.descriptions['DB_HOST']).toBe('The database host');
  });

  it('ignores #! lines', () => {
    const content = '#! meta\nDB_HOST=\n';
    const result = parseTemplate(content);
    expect(result.keys).toEqual(['DB_HOST']);
  });
});

describe('validateEnvAgainstTemplate', () => {
  const template = { keys: ['A', 'B'], required: ['A', 'B'], descriptions: {} };

  it('returns empty array when all required keys present', () => {
    expect(validateEnvAgainstTemplate({ A: 'x', B: 'y' }, template)).toEqual([]);
  });

  it('returns missing keys', () => {
    expect(validateEnvAgainstTemplate({ A: 'x' }, template)).toEqual(['B']);
  });

  it('treats empty string as missing', () => {
    expect(validateEnvAgainstTemplate({ A: '', B: 'y' }, template)).toEqual(['A']);
  });
});

describe('generateTemplateFromEnv', () => {
  it('generates template with empty values', () => {
    const result = generateTemplateFromEnv({ FOO: 'bar', BAZ: '1' });
    expect(result).toContain('FOO=');
    expect(result).toContain('BAZ=');
    expect(result).not.toContain('bar');
  });
});
