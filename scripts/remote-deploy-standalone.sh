#!/usr/bin/env bash
set -eu

ARCHIVE="${1:?archive required}"
STAMP="${2:?stamp required}"
TARGET="/opt/ai-ops-workstation"
RELEASE="/opt/ai-ops-release-${STAMP}"

test -f "${TARGET}/.env.local" || {
  echo "Missing .env.local"
  exit 1
}

pm2 delete ai-ops 2>/dev/null || true

mkdir -p "${RELEASE}"
tar -xzf "${ARCHIVE}" -C "${RELEASE}"

# Keep env from current/live app
cp -a "${TARGET}/.env.local" "${RELEASE}/.env.local"

cat > "${RELEASE}/ecosystem.config.js" <<'ECO'
module.exports = {
  apps: [{
    name: 'ai-ops',
    script: 'server.js',
    cwd: '/opt/ai-ops-workstation',
    env: {
      PORT: '3002',
      HOSTNAME: '0.0.0.0',
      NODE_ENV: 'production'
    },
    max_memory_restart: '250M'
  }]
}
ECO

# Atomic switch
if [ -d "${TARGET}" ]; then
  mv "${TARGET}" "/opt/ai-ops-workstation-prev-${STAMP}"
fi
mv "${RELEASE}" "${TARGET}"

cd "${TARGET}"
pm2 start ecosystem.config.js
pm2 save

sleep 2
curl -sI "http://127.0.0.1:3002" | head -10
curl -s "http://127.0.0.1:3002/api/health" || true
echo
echo DEPLOY_OK
