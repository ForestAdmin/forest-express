# Build

To transpile from `src` to `build` using babel:

`yarn build`

To do it at every js file change in the `src` folder:

`yarn build:watch`

# Deploy

To increment the version and push to devel and master:

- `yarn deploy --patch`
- `yarn deploy --minor`
- `yarn deploy --major`

Then, for public release:

`npm publish`

or, for beta release:

`npm publish --tag beta`

# Lint

`yarn lint`

# Test

`yarn test`
