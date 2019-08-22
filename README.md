# Forest Express Lianas dependency
[![npm package](https://badge.fury.io/js/forest-express.svg)](https://badge.fury.io/js/forest-express) [![CI status](https://travis-ci.org/ForestAdmin/forest-express.svg?branch=devel)](https://travis-ci.org/ForestAdmin/forest-express)

## Build

To transpile from `src` to `build` using babel:

`yarn build`

To do it at every js file change in the `src` folder:

`yarn build:watch`

## Deploy

To increment the version and push to devel and master:

- `yarn deploy --patch`
- `yarn deploy --minor`
- `yarn deploy --major`

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
