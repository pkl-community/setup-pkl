if($args.count -ne 1) {
    Write-Host "This command requires 1 arg with the version to check"
    exit 1
}

$result = pkl.exe --version | Select-String -Pattern $args[0] -Quiet

if($result -eq "True") {
    exit 0
} else {
    exit 1
}