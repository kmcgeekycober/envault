import { Command } from 'commander';
import { registerTagCommands } from './tagCommand';
import * as tagModule from './tag';

function makeProgram() {
  const program = new Command();
  program.exitOverride();
  registerTagCommands(program);
  return program;
}

describe('tagCommand', () => {
  let addTag: jest.SpyInstance;
  let removeTag: jest.SpyInstance;
  let loadTags: jest.SpyInstance;
  let formatTags: jest.SpyInstance;

  beforeEach(() => {
    addTag = jest.spyOn(tagModule, 'addTag').mockReturnValue({ name: 'prod', files: ['.env.prod'], createdAt: '' });
    removeTag = jest.spyOn(tagModule, 'removeTag').mockReturnValue(true);
    loadTags = jest.spyOn(tagModule, 'loadTags').mockReturnValue({ tags: [] });
    formatTags = jest.spyOn(tagModule, 'formatTags').mockReturnValue('No tags defined.');
  });

  afterEach(() => jest.restoreAllMocks());

  it('add calls addTag', () => {
    const program = makeProgram();
    const log = jest.spyOn(console, 'log').mockImplementation();
    program.parse(['node', 'envault', 'tag', 'add', 'prod', '.env.prod']);
    expect(addTag).toHaveBeenCalledWith('prod', ['.env.prod']);
    log.mockRestore();
  });

  it('remove calls removeTag', () => {
    const program = makeProgram();
    const log = jest.spyOn(console, 'log').mockImplementation();
    program.parse(['node', 'envault', 'tag', 'remove', 'prod']);
    expect(removeTag).toHaveBeenCalledWith('prod');
    log.mockRestore();
  });

  it('list calls loadTags and formatTags', () => {
    const program = makeProgram();
    const log = jest.spyOn(console, 'log').mockImplementation();
    program.parse(['node', 'envault', 'tag', 'list']);
    expect(loadTags).toHaveBeenCalled();
    expect(formatTags).toHaveBeenCalled();
    log.mockRestore();
  });

  it('remove logs error when tag not found', () => {
    removeTag.mockReturnValue(false);
    const program = makeProgram();
    const err = jest.spyOn(console, 'error').mockImplementation();
    program.parse(['node', 'envault', 'tag', 'remove', 'ghost']);
    expect(err).toHaveBeenCalledWith(expect.stringContaining('not found'));
    err.mockRestore();
  });
});
