#!/usr/bin/env bash
set -euo pipefail

REMOTE_DIR="/opt/ai-ops-workstation"
ARCHIVE="${1:?archive path required}"
STAMP="${2:?stamp required}"

test -f "${REMOTE_DIR}/.env.local" || {
  echo "Missing .env.local on server"
  exit 1
}

pm2 stop ai-ops 2>/dev/null || true

cp -a "${REMOTE_DIR}/.env.local" "/tmp/ai-ops-env-${STAMP}"
if [ -f "${REMOTE_DIR}/ecosystem.config.js" ]; then
  cp -a "${REMOTE_DIR}/ecosystem.config.js" "/tmp/ai-ops-eco-${STAMP}"
fi

if [ -d "${REMOTE_DIR}" ]; then
  mv "${REMOTE_DIR}" "${REMOTE_DIR}-backup-${STAMP}"
fi

mkdir -p "${REMOTE_DIR}"
tar -xzf "${ARCHIVE}" -C "${REMOTE_DIR}"

cp -a "/tmp/ai-ops-env-${STAMP}" "${REMOTE_DIR}/.env.local"
if [ -f "/tmp/ai-ops-eco-${STAMP}" ]; then
  cp -a "/tmp/ai-ops-eco-${STAMP}" "${REMOTE_DIR}/ecosystem.config.js"
else
  cat > "${REMOTE_DIR}/ecosystem.config.js" <<'ECO'
module.exports = {
  apps: [{
    name: 'ai-ops',
    script: 'npm',
    args: 'start',
    cwd: '/opt/ai-ops-workstation',
    env: {
      PORT: '3002',
      NODE_ENV: 'production'
    },
    max_memory_restart: '200M'
  }]
}
ECO
fi

cd "${REMOTE_DIR}"
npm install
npm run build

pm2 delete ai-ops 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save

echo "--- health ---"
curl -sI "http://127.0.0.1:3002" | head -8
echo "DEPLOY_OK"
