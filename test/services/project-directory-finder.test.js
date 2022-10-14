const sinon = require('sinon');
const { init, inject } = require('@forestadmin/context');
const path = require('path');
const ProjectDirectoryFinder = require('../../src/services/project-directory-finder');

init((context) => context.addInstance('path', path));

const projectDirectoryFinder = new ProjectDirectoryFinder(inject());

describe('services > project-directory-finder', () => {
  describe('using POSIX based OS', () => {
    describe('running the app outside of its directory', () => {
      describe('using a NPM install', () => {
        it('should still return the absolute path of the project directory', () => {
          const cwdStub = sinon.stub(process, 'cwd');
          cwdStub.returns('/Users/forestUser/projects');
          sinon.replace(projectDirectoryFinder, 'dirname', '/Users/forestUser/projects/myLumberProject/node_modules/forest-express/dist/utils');

          const absoluteProjectPath = projectDirectoryFinder.getAbsolutePath();

          expect(absoluteProjectPath).toBe('/Users/forestUser/projects/myLumberProject');

          cwdStub.restore();
          sinon.restore();
        });
      });

      describe('using a Yarn "berry" "install', () => {
        describe('in default mode', () => {
          it('should return the absolute path of the project directory', () => {
            const cwdStub = sinon.stub(process, 'cwd');
            cwdStub.returns('/Users/forest/User/projects');
            sinon.replace(projectDirectoryFinder, 'dirname', '/Users/forestUser/projects/myLumberProject/.yarn/cache/forest-express-npm-8.3.1-a520e9a060-7158678646.zip/node_modules/forest-express/dist/utils');

            const absoluteProjectPath = projectDirectoryFinder.getAbsolutePath();

            expect(absoluteProjectPath).toBe('/Users/forestUser/projects/myLumberProject');

            cwdStub.restore();
            sinon.restore();
          });
        });

        describe('in unplugged mode', () => {
          it('should return the absolute path of the project directory', () => {
            const cwdStub = sinon.stub(process, 'cwd');
            cwdStub.returns('/Users/forestUser/projects');
            sinon.replace(projectDirectoryFinder, 'dirname', '/Users/forestUser/projects/myLumberProject/.yarn/unplugged/forest-express-npm-8.3.1-a520e9a060-7158678646/dist/utils');

            const absoluteProjectPath = projectDirectoryFinder.getAbsolutePath();

            expect(absoluteProjectPath).toBe('/Users/forestUser/projects/myLumberProject');

            cwdStub.restore();
            sinon.restore();
          });
        });
      });
    });

    describe('running the app in its directory', () => {
      describe('using a NPM install', () => {
        it('should return the absolute path of the project directory', () => {
          const cwdStub = sinon.stub(process, 'cwd');
          cwdStub.returns('/Users/forestUser/projects/myLumberProject');
          sinon.replace(projectDirectoryFinder, 'dirname', '/Users/forestUser/projects/myLumberProject/node_modules/forest-express/dist/utils');

          const absoluteProjectPath = projectDirectoryFinder.getAbsolutePath();

          expect(absoluteProjectPath).toBe('/Users/forestUser/projects/myLumberProject');

          cwdStub.restore();
          sinon.restore();
        });
      });

      describe('using a Yarn "berry" install', () => {
        describe('in default mode', () => {
          it('should return the absolute path of the project directory', () => {
            const cwdStub = sinon.stub(process, 'cwd');
            cwdStub.returns('/Users/forestUser/projects/myLumberProject');
            sinon.replace(projectDirectoryFinder, 'dirname', '/Users/forestUser/projects/myLumberProject/.yarn/cache/forest-express-npm-8.3.1-a520e9a060-7158678646.zip/node_modules/forest-express/dist/utils');

            const absoluteProjectPath = projectDirectoryFinder.getAbsolutePath();

            expect(absoluteProjectPath).toBe('/Users/forestUser/projects/myLumberProject');

            cwdStub.restore();
            sinon.restore();
          });
        });

        describe('in unplugged mode', () => {
          it('should return the absolute path of the project directory', () => {
            const cwdStub = sinon.stub(process, 'cwd');
            cwdStub.returns('/Users/forestUser/projects/myLumberProject');
            sinon.replace(projectDirectoryFinder, 'dirname', '/Users/forestUser/projects/myLumberProject/.yarn/unplugged/forest-express-npm-8.3.1-a520e9a060-7158678646/dist/utils');

            const absoluteProjectPath = projectDirectoryFinder.getAbsolutePath();

            expect(absoluteProjectPath).toBe('/Users/forestUser/projects/myLumberProject');

            cwdStub.restore();
            sinon.restore();
          });
        });
      });
    });

    describe('using forest-express as sym link package', () => {
      it('should return the current working directory', () => {
        sinon.replace(projectDirectoryFinder, 'dirname', '/Users/forestUser/projects/forest-express/dist/utils/project-directory');

        const absoluteProjectPath = projectDirectoryFinder.getAbsolutePath();

        expect(absoluteProjectPath).toStrictEqual(process.cwd());

        sinon.restore();
      });
    });
  });
});
