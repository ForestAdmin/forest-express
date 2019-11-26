const sinon = require('sinon');
const ProjectDirectoryUtils = require('../../src/utils/project-directory');

describe('utils > project-directory', () => {
  describe('using POSIX based OS', () => {
    describe('running the app outside of its directory', () => {
      const projectDirectoryUtils = new ProjectDirectoryUtils();

      it('should still return the absolute path of the project directory', () => {
        expect.assertions(1);
        const cwdStub = sinon.stub(process, 'cwd');
        cwdStub.returns('/Users/forestUser/projects');
        sinon.replace(projectDirectoryUtils, 'dirname', '/Users/forestUser/projects/myLumberProject/node_modules/forest-express/dist/utils');

        const absoluteProjectPath = projectDirectoryUtils.getAbsolutePath();

        expect(absoluteProjectPath).toStrictEqual('/Users/forestUser/projects/myLumberProject');

        cwdStub.restore();
        sinon.restore();
      });
    });

    describe('running the app in its directory', () => {
      const projectDirectoryUtils = new ProjectDirectoryUtils();

      it('should return the absolute path of the project directory', () => {
        expect.assertions(1);

        const cwdStub = sinon.stub(process, 'cwd');
        cwdStub.returns('/User/user/projects/myLumberProject');
        sinon.replace(projectDirectoryUtils, 'dirname', '/Users/forestUser/projects/myLumberProject/node_modules/forest-express/dist/utils');

        const absoluteProjectPath = projectDirectoryUtils.getAbsolutePath();

        expect(absoluteProjectPath).toStrictEqual('/Users/forestUser/projects/myLumberProject');

        cwdStub.restore();
        sinon.restore();
      });
    });

    describe('using forest-express as sym link package', () => {
      const projectDirectoryUtils = new ProjectDirectoryUtils();

      it('should return the current working directory', () => {
        expect.assertions(1);
        sinon.replace(projectDirectoryUtils, 'dirname', '/Users/forestUser/projects/forest-express/dist/utils/project-directory');

        const absoluteProjectPath = projectDirectoryUtils.getAbsolutePath();

        expect(absoluteProjectPath).toStrictEqual(process.cwd());

        sinon.restore();
      });
    });
  });
});
