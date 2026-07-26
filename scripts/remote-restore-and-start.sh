#!/usr/bin/env bash
# Emergency: restore latest backup and start ai-ops on :3002
set -eu

LATEST=$(ls -1dt /opt/ai-ops-workstation-backup-* 2>/dev/null | head -1 || true)
if [ -z "${LATEST}" ]; then
  echo "No backup found"
  ls -la /opt | grep ai-ops || true
  exit 1
fi

echo "Restoring from ${LATEST}"
pm2 stop ai-ops 2>/dev/null || true
pm2 delete ai-ops 2>/dev/null || true

if [ -d /opt/ai-ops-workstation ]; then
  mv /opt/ai-ops-workstation "/opt/ai-ops-workstation-broken-$(date +%Y%m%d%H%M%S)"
fi

mv "${LATEST}" /opt/ai-ops-workstation
cd /opt/ai-ops-workstation

if [ ! -f ecosystem.config.js ]; then
  cat > ecosystem.config.js <<'ECO'
module.exports = {
  apps: [{
    name: 'ai-ops',
    script: 'npm',
    args: 'start',
    cwd: '/opt/ai-ops-workstation',
    env: { PORT: '3002', NODE_ENV: 'production' },
    max_memory_restart: '200M'
  }]
}
ECO
fi

pm2 start ecosystem.config.js
pm2 save
curl -sI http://127.0.0.1:3002 | head -8
echo RESTORE_OK
