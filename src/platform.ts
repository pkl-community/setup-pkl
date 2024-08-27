import os from 'node:os'

enum Platform {
  Linux,
  MacOS,
  Windows
}

enum Architecture {
  arm64,
  x64
}

type PlatformInfo = {
  plat: Platform
  arch: Architecture
  githubSourceAssetName: string
  targetFileName: string
}

export function determinePlatformInfo(): PlatformInfo {
  const plat = determineOS()
  const arch = determineArch()

  return {
    plat,
    arch,
    githubSourceAssetName: determineGithubAsset(plat, arch),
    targetFileName: determineTargetFileName(plat)
  }
}

function determineOS(): Platform {
  switch (os.platform()) {
    case 'linux':
      return Platform.Linux
    case 'darwin':
      return Platform.MacOS
    case 'win32':
      return Platform.Windows
    default:
      throw new Error('Unsupported platform')
  }
}

function determineArch(): Architecture {
  switch (os.arch()) {
    case 'arm64':
      return Architecture.arm64
    case 'x64':
      return Architecture.x64
    default:
      throw new Error('Unsupported architecture')
  }
}

function determineGithubAsset(plat: Platform, arch: Architecture): string {
  switch (plat) {
    case Platform.Linux:
      switch (arch) {
        case Architecture.arm64:
          return 'pkl-linux-aarch64'
        case Architecture.x64:
          return 'pkl-linux-amd64'
        default:
          throw new Error('Unsupported architecture')
      }
    case Platform.MacOS:
      switch (arch) {
        case Architecture.arm64:
          return 'pkl-macos-aarch64'
        case Architecture.x64:
          return 'pkl-macos-amd64'
        default:
          throw new Error('Unsupported architecture')
      }
    case Platform.Windows:
      switch (arch) {
        case Architecture.arm64:
          throw new Error('Windows arm not yet supported')
        case Architecture.x64:
          return 'pkl-windows-amd64.exe'
        default:
          throw new Error('Unsupported architecture')
      }
    default:
      throw new Error('Unsupported platform')
  }
}

function determineTargetFileName(plat: Platform): string {
  switch (plat) {
    case Platform.Windows:
      return 'pkl.exe'
    default:
      return 'pkl'
  }
}
