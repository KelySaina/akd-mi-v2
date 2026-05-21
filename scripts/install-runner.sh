#!/usr/bin/env bash
# Install and register a GitHub Actions self-hosted runner as a systemd service.
#
# Usage (on the target server, as a user with sudo):
#   curl -fsSL https://raw.githubusercontent.com/KelySaina/akd-mi-v2/main/scripts/install-runner.sh -o install-runner.sh
#   chmod +x install-runner.sh
#   sudo ./install-runner.sh <REGISTRATION_TOKEN>
#
# Get REGISTRATION_TOKEN from:
#   https://github.com/KelySaina/akd-mi-v2/settings/actions/runners/new
#
# Optional env vars:
#   RUNNER_VERSION=2.319.1           # change if a newer version is shown on the page
#   RUNNER_NAME=$(hostname)
#   RUNNER_LABELS=self-hosted,linux,x64,akd-mi
#   RUNNER_WORKDIR=_work
#   RUNNER_USER=actions               # dedicated unprivileged user
set -euo pipefail

TOKEN="${1:-}"
if [[ -z "$TOKEN" ]]; then
    echo "Usage: $0 <REGISTRATION_TOKEN>" >&2
    exit 1
fi

REPO_URL="https://github.com/KelySaina/akd-mi-v2"
RUNNER_VERSION="${RUNNER_VERSION:-2.319.1}"
RUNNER_NAME="${RUNNER_NAME:-$(hostname)}"
RUNNER_LABELS="${RUNNER_LABELS:-self-hosted,linux,x64,akd-mi}"
RUNNER_WORKDIR="${RUNNER_WORKDIR:-_work}"
RUNNER_USER="${RUNNER_USER:-actions}"
RUNNER_HOME="/opt/actions-runner"

echo "==> Installing prerequisites"
apt-get update -y
apt-get install -y --no-install-recommends \
    curl ca-certificates tar git jq sudo libicu-dev

echo "==> Ensuring docker is available (skipping if already installed)"
if ! command -v docker >/dev/null 2>&1; then
    curl -fsSL https://get.docker.com | sh
    systemctl enable --now docker
fi

echo "==> Creating runner user '$RUNNER_USER'"
if ! id -u "$RUNNER_USER" >/dev/null 2>&1; then
    useradd --system --create-home --shell /bin/bash "$RUNNER_USER"
fi
usermod -aG docker "$RUNNER_USER" || true

echo "==> Preparing $RUNNER_HOME"
mkdir -p "$RUNNER_HOME"
chown "$RUNNER_USER:$RUNNER_USER" "$RUNNER_HOME"

ARCH="$(uname -m)"
case "$ARCH" in
    x86_64)  RUNNER_ARCH=x64 ;;
    aarch64) RUNNER_ARCH=arm64 ;;
    *) echo "Unsupported arch: $ARCH" >&2; exit 2 ;;
esac

TARBALL="actions-runner-linux-${RUNNER_ARCH}-${RUNNER_VERSION}.tar.gz"
URL="https://github.com/actions/runner/releases/download/v${RUNNER_VERSION}/${TARBALL}"

echo "==> Downloading runner $RUNNER_VERSION ($RUNNER_ARCH)"
sudo -u "$RUNNER_USER" bash -c "
    set -euo pipefail
    cd '$RUNNER_HOME'
    if [[ ! -f '$TARBALL' ]]; then
        curl -fL -o '$TARBALL' '$URL'
    fi
    tar xzf '$TARBALL'
"

echo "==> Configuring runner against $REPO_URL"
sudo -u "$RUNNER_USER" bash -c "
    set -euo pipefail
    cd '$RUNNER_HOME'
    if [[ -f .runner ]]; then
        echo '   already configured \u2014 unregister first with: ./config.sh remove --token <NEW_TOKEN>'
        exit 0
    fi
    ./config.sh \
        --unattended \
        --url '$REPO_URL' \
        --token '$TOKEN' \
        --name '$RUNNER_NAME' \
        --labels '$RUNNER_LABELS' \
        --work '$RUNNER_WORKDIR' \
        --replace
"

echo "==> Installing as systemd service"
cd "$RUNNER_HOME"
./svc.sh install "$RUNNER_USER"
./svc.sh start

echo
echo "==> Done. Status:"
./svc.sh status || true
echo
echo "Verify on GitHub: $REPO_URL/settings/actions/runners"
