#!/usr/bin/env bash
# Checks a packed canary.s9pk: its git hash and image set, that the backend's system
# certificate store does not trust the roots the leaked emSign intermediates chain to, and
# that no image carries a known CRITICAL or HIGH vulnerability. Fails closed: a check that
# reads nothing fails. Needs start-cli, unsquashfs, openssl, jq and docker.
set -euo pipefail

if [ $# -ne 2 ]; then
  echo "usage: $0 <canary.s9pk> <expected git hash>" >&2
  exit 2
fi
[ -f "$1" ] || { echo "no such package: $1" >&2; exit 2; }
s9pk=$(realpath "$1")
expected=$2

# Public-key fingerprints of emSign ECC Root CA - G3 and AAA Certificate Services.
distrusted="8d417db2dd8bf5e3084d1e3f196d583849d81bdd4c00c70b9d39369e96b8c782 bd153ed7b0434f6886b17bce8bbe84ed340c7132d702a8f4fa318f756ecbd6f3"
# ISRG Root X1. It must be found, or the fingerprints are not being read.
control=0b9fa5a59eed715c26c1020c711b4f6ec42d58b0015e14337a39dad301c5afc3
empty=e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
# trivy 0.70.0.
trivy=aquasec/trivy@sha256:be1190afcb28352bfddc4ddeb71470835d16462af68d310f9f4bca710961a41e

fail() { echo "::error::$*"; exit 1; }

work=$(mktemp -d)
trap 'chmod -R u+w "$work" 2> /dev/null; rm -rf "$work"' EXIT
cd "$work"

start-cli s9pk inspect "$s9pk" manifest > manifest.json
jq '{version, gitHash, osVersion, sdkVersion}' manifest.json
hash=$(jq -r .gitHash manifest.json)
[ "$hash" = "$expected" ] || fail "gitHash $hash is not the expected commit $expected"
[ "$(jq -c '.images | keys' manifest.json)" = '["backend","frontend"]' ] \
  || fail "the image set changed to $(jq -c '.images | keys' manifest.json); update this check to cover it"
for img in backend frontend; do
  jq -e --arg i "$img" '.images[$i].arch | sort == ["aarch64", "x86_64"]' manifest.json > /dev/null \
    || fail "the $img image is not built for both aarch64 and x86_64"
done

mkdir rootfs
for arch in aarch64 x86_64; do
  for img in backend frontend; do
    start-cli s9pk inspect "$s9pk" cat "images/$arch/$img.squashfs" > "$img-$arch.squashfs"
    unsquashfs -q -no-progress -d "rootfs/$img-$arch" "$img-$arch.squashfs"
  done
done

for arch in aarch64 x86_64; do
  root="rootfs/backend-$arch"
  for path in etc etc/ssl etc/ssl/certs etc/ssl/certs/ca-certificates.crt; do
    [ ! -L "$root/$path" ] || fail "$arch: $path is a symlink, so the store cannot be read inside the image"
  done
  [ -f "$root/etc/ssl/certs/ca-certificates.crt" ] || fail "$arch: no system certificate store"
  start-cli s9pk inspect "$s9pk" cat "images/$arch/backend.env" > "env-$arch"
  ! grep -qE '^SSL_CERT_(FILE|DIR)=' "env-$arch" \
    || fail "$arch: the image overrides the system certificate store with SSL_CERT_FILE or SSL_CERT_DIR"
  certs=$(mktemp -d)
  awk -v d="$certs" '/BEGIN CERTIFICATE/ {n++; f = sprintf("%s/%04d.pem", d, n)} f {print > f} /END CERTIFICATE/ {close(f); f = ""}' \
    "$root/etc/ssl/certs/ca-certificates.crt"
  for c in "$certs"/*.pem; do
    openssl x509 -in "$c" -noout -pubkey | openssl pkey -pubin -outform DER | sha256sum | cut -d' ' -f1
  done > "spki-$arch.txt"
  echo "$arch: $(wc -l < "spki-$arch.txt") certificates in the backend's system store"
  ! grep -qx "$empty" "spki-$arch.txt" || fail "$arch: a certificate in the store could not be read"
  grep -qx "$control" "spki-$arch.txt" || fail "$arch: the control root is missing, so this check proves nothing"
  for key in $distrusted; do
    ! grep -qx "$key" "spki-$arch.txt" || fail "$arch: the system store trusts a distrusted root ($key)"
  done
done

mkdir -p "${TRIVY_CACHE:-$HOME/.cache/trivy}"
status=0
for root in rootfs/*; do
  name=$(basename "$root")
  docker run --rm -v "$work/$root:/rootfs:ro" -v "${TRIVY_CACHE:-$HOME/.cache/trivy}:/root/.cache/trivy" "$trivy" \
    rootfs /rootfs --ignore-unfixed --severity CRITICAL,HIGH --scanners vuln --format json --quiet > "trivy-$name.json"
  os=$(jq -r '.Metadata.OS.Family // empty' "trivy-$name.json")
  findings=$(jq '[.Results[]?.Vulnerabilities[]?] | length' "trivy-$name.json")
  echo "$name: ${os:-no OS detected}, $findings CRITICAL or HIGH"
  if [ -z "$os" ]; then
    echo "::error::$name: trivy detected no operating system, so the scan proves nothing"
    status=1
  elif [ "$findings" -gt 0 ]; then
    jq -r '.Results[]? | .Target as $t | .Vulnerabilities[]? | "  \(.Severity) \(.VulnerabilityID) \(.PkgName) \(.InstalledVersion) in \($t)"' "trivy-$name.json"
    echo "::error::$name: $findings CRITICAL or HIGH vulnerabilities"
    status=1
  fi
done
exit $status
