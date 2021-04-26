const sinon = require('sinon');
const ProjectDirectoryUtils = require('../../src/utils/project-directory');

describe('utils > project-directory', () => {
  describe('using POSIX based OS', () => {
    describe('running the app outside of its directory', () => {
      describe('using a NPM install', () => {
        it('should still return the absolute path of the project directory', () => {
          expect.assertions(1);

          const projectDirectoryUtils = new ProjectDirectoryUtils();
          const cwdStub = sinon.stub(process, 'cwd');
          cwdStub.returns('/Users/forestUser/projects');
          sinon.replace(projectDirectoryUtils, 'dirname', '/Users/forestUser/projects/myLumberProject/node_modules/forest-express/dist/utils');

          const absoluteProjectPath = projectDirectoryUtils.getAbsolutePath();

          expect(absoluteProjectPath).toStrictEqual('/Users/forestUser/projects/myLumberProject');

          cwdStub.restore();
          sinon.restore();
        });
      });

      describe('using a Yarn "berry" "install', () => {
        describe('in default mode', () => {
          it('should return the absolute path of the project directory', () => {
            expect.assertions(1);

            const projectDirectoryUtils = new ProjectDirectoryUtils();
            const cwdStub = sinon.stub(process, 'cwd');
            cwdStub.returns('/Users/forest/User/projects');
            sinon.replace(projectDirectoryUtils, 'dirname', '/Users/forestUser/projects/myLumberProject/.yarn/cache/forest-express-npm-8.3.1-a520e9a060-7158678646.zip/node_modules/forest-express/dist/utils');

            const absoluteProjectPath = projectDirectoryUtils.getAbsolutePath();

            expect(absoluteProjectPath).toStrictEqual('/Users/forestUser/projects/myLumberProject');

            cwdStub.restore();
            sinon.restore();
          });
        });

        describe('in unplugged mode', () => {
          it('should return the absolute path of the project directory', () => {
            expect.assertions(1);

            const projectDirectoryUtils = new ProjectDirectoryUtils();
            const cwdStub = sinon.stub(process, 'cwd');
            cwdStub.returns('/Users/forestUser/projects');
            sinon.replace(projectDirectoryUtils, 'dirname', '/Users/forestUser/projects/myLumberProject/.yarn/unplugged/forest-express-npm-8.3.1-a520e9a060-7158678646/dist/utils');

            const absoluteProjectPath = projectDirectoryUtils.getAbsolutePath();

            expect(absoluteProjectPath).toStrictEqual('/Users/forestUser/projects/myLumberProject');

            cwdStub.restore();
            sinon.restore();
          });
        });
      });

      describe('using forest-express install from yarn berry', () => {
        it('should return the absolute path of the project directory', () => {
          expect.assertions(1);

          const projectDirectoryUtils = new ProjectDirectoryUtils();
          const cwdStub = sinon.stub(process, 'cwd');
          cwdStub.returns('/Users/forestUser/projects');
          sinon.replace(projectDirectoryUtils, 'dirname', '/Users/forestUser/projects/myLumberProject/node_modules/forest-express/dist/utils');

          const absoluteProjectPath = projectDirectoryUtils.getAbsolutePath();

          expect(absoluteProjectPath).toStrictEqual('/Users/forestUser/projects/myLumberProject');

          cwdStub.restore();
          sinon.restore();
        });
      });

      describe('using a Yarn "berry" "install', () => {
        describe('in default mode', () => {
          it('should return the absolute path of the project directory', () => {
            expect.assertions(1);

            const projectDirectoryUtils = new ProjectDirectoryUtils();
            const cwdStub = sinon.stub(process, 'cwd');
            cwdStub.returns('/Users/forest/User/projects');
            sinon.replace(projectDirectoryUtils, 'dirname', '/Users/forestUser/projects/myLumberProject/.yarn/cache/forest-express-npm-8.3.1-a520e9a060-7158678646.zip/node_modules/forest-express/dist/utils');

            const absoluteProjectPath = projectDirectoryUtils.getAbsolutePath();

            expect(absoluteProjectPath).toStrictEqual('/Users/forestUser/projects/myLumberProject');

            cwdStub.restore();
            sinon.restore();
          });
        });

    describe('running the app in its directory', () => {
      describe('using a NPM install', () => {
        it('should return the absolute path of the project directory', () => {
          expect.assertions(1);

          const projectDirectoryUtils = new ProjectDirectoryUtils();
          const cwdStub = sinon.stub(process, 'cwd');
          cwdStub.returns('/Users/forestUser/projects/myLumberProject');
          sinon.replace(projectDirectoryUtils, 'dirname', '/Users/forestUser/projects/myLumberProject/node_modules/forest-express/dist/utils');

          const absoluteProjectPath = projectDirectoryUtils.getAbsolutePath();

          expect(absoluteProjectPath).toStrictEqual('/Users/forestUser/projects/myLumberProject');

          cwdStub.restore();
          sinon.restore();
        });
      });

      describe('using a Yarn "berry" install', () => {
        describe('in default mode', () => {
          it('should return the absolute path of the project directory', () => {
            expect.assertions(1);

            const projectDirectoryUtils = new ProjectDirectoryUtils();
            const cwdStub = sinon.stub(process, 'cwd');
            cwdStub.returns('/Users/forestUser/projects/myLumberProject');
            sinon.replace(projectDirectoryUtils, 'dirname', '/Users/forestUser/projects/myLumberProject/.yarn/cache/forest-express-npm-8.3.1-a520e9a060-7158678646.zip/node_modules/forest-express/dist/utils');

            const absoluteProjectPath = projectDirectoryUtils.getAbsolutePath();

            expect(absoluteProjectPath).toStrictEqual('/Users/forestUser/projects/myLumberProject');

            cwdStub.restore();
            sinon.restore();
          });
        });

        describe('in unplugged mode', () => {
          it('should return the absolute path of the project directory', () => {
            expect.assertions(1);

            const projectDirectoryUtils = new ProjectDirectoryUtils();
            const cwdStub = sinon.stub(process, 'cwd');
            cwdStub.returns('/Users/forestUser/projects/myLumberProject');
            sinon.replace(projectDirectoryUtils, 'dirname', '/Users/forestUser/projects/myLumberProject/.yarn/unplugged/forest-express-npm-8.3.1-a520e9a060-7158678646/dist/utils');

            const absoluteProjectPath = projectDirectoryUtils.getAbsolutePath();

            expect(absoluteProjectPath).toStrictEqual('/Users/forestUser/projects/myLumberProject');

            cwdStub.restore();
            sinon.restore();
          });
        });
      });
    });

    describe('running the app in its directory', () => {
      describe('using a NPM install', () => {
        it('should return the absolute path of the project directory', () => {
          expect.assertions(1);

          const projectDirectoryUtils = new ProjectDirectoryUtils();
          const cwdStub = sinon.stub(process, 'cwd');
          cwdStub.returns('/Users/forestUser/projects/myLumberProject');
          sinon.replace(projectDirectoryUtils, 'dirname', '/Users/forestUser/projects/myLumberProject/node_modules/forest-express/dist/utils');

          const absoluteProjectPath = projectDirectoryUtils.getAbsolutePath();

          expect(absoluteProjectPath).toStrictEqual('/Users/forestUser/projects/myLumberProject');

          cwdStub.restore();
          sinon.restore();
        });
      });

      describe('using a Yarn "berry" install', () => {
        describe('in default mode', () => {
          it('should return the absolute path of the project directory', () => {
            expect.assertions(1);

            const projectDirectoryUtils = new ProjectDirectoryUtils();
            const cwdStub = sinon.stub(process, 'cwd');
            cwdStub.returns('/Users/forestUser/projects/myLumberProject');
            sinon.replace(projectDirectoryUtils, 'dirname', '/Users/forestUser/projects/myLumberProject/.yarn/cache/forest-express-npm-8.3.1-a520e9a060-7158678646.zip/node_modules/forest-express/dist/utils');

            const absoluteProjectPath = projectDirectoryUtils.getAbsolutePath();

            expect(absoluteProjectPath).toStrictEqual('/Users/forestUser/projects/myLumberProject');

            cwdStub.restore();
            sinon.restore();
          });
        });

        describe('in unplugged mode', () => {
          it('should return the absolute path of the project directory', () => {
            expect.assertions(1);

            const projectDirectoryUtils = new ProjectDirectoryUtils();
            const cwdStub = sinon.stub(process, 'cwd');
            cwdStub.returns('/Users/forestUser/projects/myLumberProject');
            sinon.replace(projectDirectoryUtils, 'dirname', '/Users/forestUser/projects/myLumberProject/.yarn/unplugged/forest-express-npm-8.3.1-a520e9a060-7158678646/dist/utils');

            const absoluteProjectPath = projectDirectoryUtils.getAbsolutePath();

            expect(absoluteProjectPath).toStrictEqual('/Users/forestUser/projects/myLumberProject');

            cwdStub.restore();
            sinon.restore();
          });
        });
      });
    });

    describe('using forest-express as sym link package', () => {
      it('should return the current working directory', () => {
        expect.assertions(1);

        const projectDirectoryUtils = new ProjectDirectoryUtils();
        sinon.replace(projectDirectoryUtils, 'dirname', '/Users/forestUser/projects/forest-express/dist/utils/project-directory');

        const absoluteProjectPath = projectDirectoryUtils.getAbsolutePath();

        expect(absoluteProjectPath).toStrictEqual(process.cwd());

        sinon.restore();
      });
    });
  });
});
