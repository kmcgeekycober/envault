import { Command } from 'commander';
import { registerProfileCommands } from './profileCommand';
import * as profileModule from './profile';

function makeProgram() {
  const p = new Command();
  p.exitOverride();
  registerProfileCommands(p);
  return p;
}

describe('profileCommand', () => {
  let addSpy: jest.SpyInstance;
  let removeSpy: jest.SpyInstance;
  let useSpy: jest.SpyInstance;
  let currentSpy: jest.SpyInstance;
  let listSpy: jest.SpyInstance;
  let log: jest.SpyInstance;

  beforeEach(() => {
    addSpy = jest.spyOn(profileModule, 'addProfile').mockReturnValue({ name: 'dev', file: '.env.dev' });
    removeSpy = jest.spyOn(profileModule, 'removeProfile').mockImplementation(() => {});
    useSpy = jest.spyOn(profileModule, 'setActiveProfile').mockImplementation(() => {});
    currentSpy = jest.spyOn(profileModule, 'getActiveProfile').mockReturnValue({ name: 'dev', file: '.env.dev' });
    listSpy = jest.spyOn(profileModule, 'listProfiles').mockReturnValue([{ name: 'dev', file: '.env.dev' }]);
    log = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => jest.restoreAllMocks());

  it('add calls addProfile', async () => {
    await makeProgram().parseAsync(['node', 'envault', 'profile', 'add', 'dev', '.env.dev']);
    expect(addSpy).toHaveBeenCalledWith('dev', '.env.dev', undefined);
  });

  it('remove calls removeProfile', async () => {
    await makeProgram().parseAsync(['node', 'envault', 'profile', 'remove', 'dev']);
    expect(removeSpy).toHaveBeenCalledWith('dev');
  });

  it('use calls setActiveProfile', async () => {
    await makeProgram().parseAsync(['node', 'envault', 'profile', 'use', 'dev']);
    expect(useSpy).toHaveBeenCalledWith('dev');
  });

  it('current shows active profile', async () => {
    await makeProgram().parseAsync(['node', 'envault', 'profile', 'current']);
    expect(log).toHaveBeenCalledWith(expect.stringContaining('dev'));
  });

  it('list shows profiles', async () => {
    await makeProgram().parseAsync(['node', 'envault', 'profile', 'list']);
    expect(listSpy).toHaveBeenCalled();
  });
});
