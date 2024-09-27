import os from 'node:os'

type Platform = 'linux' | 'macos' | 'windows'
type Architecture = 'amd64' | 'aarch64'

type PlatformInfo = {
  githubSourceAssetName: string
  targetFileName: string
}

export function determinePlatformInfo(): PlatformInfo {
  const plat = determineOS()
  const arch = determineArch()

  return {
    githubSourceAssetName: determineGithubAsset(plat, arch),
    targetFileName: determineTargetFileName(plat)
  }
}

function determineOS(): Platform {
  switch (os.platform()) {
    case 'linux':
      return 'linux'
    case 'darwin':
      return 'macos'
    case 'win32':
      return 'windows'
    default:
      throw new Error('Unsupported platform')
  }
}

function determineArch(): Architecture {
  switch (os.arch()) {
    case 'arm64':
      return 'aarch64'
    case 'x64':
      return 'amd64'
    default:
      throw new Error('Unsupported architecture')
  }
}

function determineGithubAsset(plat: Platform, arch: Architecture): string {
  if (plat === 'windows') {
    return `pkl-windows-${arch}.exe`
  }

  return `pkl-${plat}-${arch}`
}

function determineTargetFileName(plat: Platform): string {
  switch (plat) {
    case 'windows':
      return 'pkl.exe'
    default:
      return 'pkl'
  }
}
