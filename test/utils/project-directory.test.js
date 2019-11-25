const sinon = require('sinon');
const ProjectDirectoryUtils = require('../../src/utils/project-directory');

describe('utils > project-directory', () => {
  describe('using POSIX based OS', () => {
    describe('running the app outside of its directory', () => {
      const projectDirectoryUtils = new ProjectDirectoryUtils();
      let cwdStub;

      beforeEach(() => {
        cwdStub = sinon.stub(process, 'cwd');
        cwdStub.returns('/Users/forestUser/projects');
        sinon.replace(projectDirectoryUtils, 'dirname', '/Users/forestUser/projects/myLumberProject/node_modules/forest-express/dist/utils');
      });

      afterEach(() => {
        cwdStub.restore();
        sinon.restore();
      });

      it('should still return the absolute path of the project directory', () => {
        expect.assertions(1);

        const absoluteProjectPath = projectDirectoryUtils.getAbsolutePath();

        expect(absoluteProjectPath).toStrictEqual('/Users/forestUser/projects/myLumberProject');
      });
    });

    describe('running the app in its directory', () => {
      const projectDirectoryUtils = new ProjectDirectoryUtils();
      let cwdStub;

      beforeEach(() => {
        cwdStub = sinon.stub(process, 'cwd');
        cwdStub.returns('/User/user/projects/myLumberProject');
        sinon.replace(projectDirectoryUtils, 'dirname', '/Users/forestUser/projects/myLumberProject/node_modules/forest-express/dist/utils');
      });

      afterEach(() => {
        cwdStub.restore();
        sinon.restore();
      });

      it('should return the absolute path of the project directory', () => {
        expect.assertions(1);

        const absoluteProjectPath = projectDirectoryUtils.getAbsolutePath();

        expect(absoluteProjectPath).toStrictEqual('/Users/forestUser/projects/myLumberProject');
      });
    });

    describe('using forest-express as sym link package', () => {
      const projectDirectoryUtils = new ProjectDirectoryUtils();

      beforeEach(() => {
        sinon.replace(projectDirectoryUtils, 'dirname', '/Users/forestUser/projects/forest-express/dist/utils/project-directory');
      });

      afterEach(() => {
        sinon.restore();
      });

      it('should return the current working directory', () => {
        expect.assertions(1);

        const absoluteProjectPath = projectDirectoryUtils.getAbsolutePath();

        expect(absoluteProjectPath).toStrictEqual(process.cwd());
      });
    });
  });
});
