# Contributing to node-ntlm

## Found an Issue?

If you find a bug in the source code or a mistake in the documentation, you can help us
by [submitting an issue](https://github.com/nrwl/nx/blob/master/CONTRIBUTING.md#submit-issue)
to [our GitHub Repository](https://github.com/skrtheboss/node-ntlm). Even better, you
can [submit a Pull Request](https://github.com/skrtheboss/node-ntlm/blob/master/CONTRIBUTING.md#submit-pr) with a fix.

## Project Structure

Source code is included in the top-level folders listed below.

-   `packages` - Source code for Nx packages such as Angular, React, Web, NestJS, Next and others including generators and
    executors (or builders).
-   `scripts` - Miscellaneous scripts for project tasks such as building documentation, testing, and code formatting.
-   `tmp` - Folder used by e2e tests. If you are a WebStorm user, make sure to mark this folder as excluded.

## Building the Project

After cloning the project to your machine, to install the dependencies, run:

```bash
yarn install
```

To build all the packages, run:

```bash
yarn build
```

### Running Unit Tests

To make sure your changes do not break any unit tests, run the following:

```bash
nx affected --target=core
```

For example, if you need to only run the tests for the core package, run:

```bash
nx test core
```

## Submission Guidelines

### <a name="submit-pr"></a> Submitting a PR

Please follow the following guidelines:

-   Make sure unit tests pass (`nx affected --target=test`)
    -   Target a specific project with: `nx run proj:test` (i.e. `nx run core:test` to target `packages/core`)
    -   Target a specific unit test file (i.e. `packages/core/src/core.spec.ts`)
        with `npx jest core/src/core`
    -   For more options on running tests - check `npx jest --help` or visit [jestjs.io](https://jestjs.io/)
    -   Debug with `node --inspect-brk ./node_modules/jest/bin/jest.js build/packages/core/src/core.spec.ts`
-   Make sure you run `nx format`
