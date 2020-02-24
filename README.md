# Forest Express Lianas dependency
[![npm package](https://badge.fury.io/js/forest-express.svg)](https://badge.fury.io/js/forest-express)
[![CI status](https://travis-ci.org/ForestAdmin/forest-express.svg?branch=devel)](https://travis-ci.org/ForestAdmin/forest-express)
![Coverage](https://img.shields.io/badge/coverage-42%25%0A-critical)

## Build

To transpile from `src` to `build` using babel:

`yarn build`

To do it at every js file change in the `src` folder:

`yarn build:watch`

## Release

To increment the version and push to devel and master:

- `yarn release --patch`
- `yarn release --minor`
- `yarn release --major`

Then, for public release:

`npm publish`

or, for beta release:

`npm publish --tag beta`

## Lint

`yarn lint`

## Test

`yarn test`

## Community

👇 Join our Slack community of +1000 developers

[![Slack Status](http://community.forestadmin.com/badge.svg)](https://community.forestadmin.com)
