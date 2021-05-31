class ProjectDirectoryFinder {
  constructor({ path }) {
    this.path = path;
    this.dirname = __dirname;

    // NOTICE: Order does matter as packages install via yarn 2 Plug n Play mode also
    //         include node_modules in path.
    this.PATHS_ROOT_PACKAGES = [
      // Yarn 2 Plug n Play mode
      this.path.join('.yarn', 'cache'),
      this.path.join('.yarn', 'unplugged'),
      // Usual Yarn / NPM
      'node_modules',
    ];
  }

  ensureAbsolutePath(subPathsToProject) {
    // NOTICE: on POSIX system, empty path created by previous split is skipped by path.join.
    if (!this.path.isAbsolute(this.path.join(...subPathsToProject))) {
      return this.path.join(this.path.sep, ...subPathsToProject);
    }
    return this.path.join(...subPathsToProject);
  }

  getAbsolutePath() {
    for (let index = 0; index <= this.PATHS_ROOT_PACKAGES.length; index += 1) {
      const rootPackagesPath = this.PATHS_ROOT_PACKAGES[index];
      // NOTICE: forest-express has not been sym linked.
      if (this.dirname.includes(rootPackagesPath)) {
        const indexRootPath = this.dirname.indexOf(rootPackagesPath);
        const pathProjectRoot = this.dirname.substr(0, indexRootPath);
        const subPathsToProject = pathProjectRoot.split(this.path.sep);
        return this.ensureAbsolutePath(subPathsToProject);
      }
    }

    // NOTICE: forest-express is sym linked, assuming the process is running on project directory.
    return process.cwd();
  }
}

module.exports = ProjectDirectoryFinder;
