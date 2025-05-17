# `setup-pkl` GitHub Action

[![GitHub Super-Linter](https://github.com/actions/typescript-action/actions/workflows/linter.yml/badge.svg)](https://github.com/super-linter/super-linter)
![CI](https://github.com/actions/typescript-action/actions/workflows/ci.yml/badge.svg)
[![Check dist/](https://github.com/actions/typescript-action/actions/workflows/check-dist.yml/badge.svg)](https://github.com/actions/typescript-action/actions/workflows/check-dist.yml)
[![Coverage](./badges/coverage.svg)](./badges/coverage.svg)

> [!CAUTION]
>
> This GitHub Action is in PRE-RELEASE, meaning there may be unintended
> behaviour, and there is no guarantee of stability between versions. The major
> version is currently `v0` to reflect this.

This is a GitHub Action to install a binary for
[Pkl](https://github.com/apple/pkl) and add it to the PATH.

> [!NOTE]
>
> This is a project from the Pkl open-source
> [community](https://github.com/pkl-community), and is not affiliated with
> Apple in any way.

## Example Usage

```yaml
steps:
  - name: Install pkl
    uses: pkl-community/setup-pkl@v0
    with:
      pkl-version: 0.28.2
```

### Options

- `pkl-version` - (Required) The Pkl version to use. It must be a valid tag from
  the [official Apple releases](https://github.com/apple/pkl/releases).

## Development

### Setup

First clone the repository to your local machine. Then:

1. :twisted_rightwards_arrows: Use `nvm` to select the right Node version

   ```bash
   nvm use
   ```

1. :hammer_and_wrench: Install the dependencies

   ```bash
   npm install
   ```

1. :building_construction: Package the TypeScript for distribution

   ```bash
   npm run bundle
   ```

1. :white_check_mark: Run the tests

   ```bash
   npm test
   ```

This action makes use of the GitHub Actions toolkit, see the
[documentation](https://github.com/actions/toolkit/blob/master/README.md) for
more info.

## Publishing a New Release

This project includes a helper script, [`script/release`](./script/release)
designed to streamline the process of tagging and pushing new releases for
GitHub Actions.

GitHub Actions allows users to select a specific version of the action to use,
based on release tags. This script simplifies this process by performing the
following steps:

1. **Retrieving the latest release tag:** The script starts by fetching the most
   recent release tag by looking at the local data available in your repository.
1. **Prompting for a new release tag:** The user is then prompted to enter a new
   release tag. To assist with this, the script displays the latest release tag
   and provides a regular expression to validate the format of the new tag.
1. **Tagging the new release:** Once a valid new tag is entered, the script tags
   the new release.
1. **Pushing the new tag to the remote:** Finally, the script pushes the new tag
   to the remote repository. From here, you will need to create a new release in
   GitHub and users can easily reference the new tag in their workflows.
