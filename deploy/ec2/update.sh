#!/usr/bin/env bash
# Run manually on Ubuntu: sudo bash update.sh
set -Eeuo pipefail
if [[ $(id -u) != 0 ]]; then echo 'Run with sudo.' >&2; exit 1; fi
command -v docker >/dev/null || { echo 'Install Docker first.' >&2; exit 1; }
command -v git >/dev/null || { apt-get update; apt-get install -y git; }
command -v curl >/dev/null || { apt-get update; apt-get install -y curl; }
docker buildx version >/dev/null || { apt-get update; apt-get install -y docker-buildx; }
install -d /opt/stronghold-git /var/lock
exec 9>/var/lock/stronghold-update.lock
flock -n 9 || { echo 'Another update is running.' >&2; exit 1; }
repo=https://github.com/moring-m/Stronghold-Protocol_Ko_Arca.git
checkout=/opt/stronghold-git/source
if [[ ! -d "$checkout/.git" ]]; then
  [[ ! -e "$checkout" ]] || { echo "Existing non-Git path: $checkout" >&2; exit 1; }
  git clone --branch master --single-branch "$repo" "$checkout"
fi
cd "$checkout"
[[ $(git remote get-url origin) == "$repo" ]] || { echo 'Unexpected Git remote.' >&2; exit 1; }
[[ -z $(git status --porcelain) ]] || { echo 'Checkout has local changes; update stopped.' >&2; exit 1; }
git checkout master
git pull --ff-only origin master
# Execute the updater from the downloaded revision, including future updater fixes.
if [[ ${STRONGHOLD_UPDATER_REVISION:-} != $(git rev-parse HEAD) ]]; then
  export STRONGHOLD_UPDATER_REVISION=$(git rev-parse HEAD)
  exec bash "$checkout/deploy/ec2/update.sh"
fi
revision=$(git rev-parse --short=12 HEAD)
image="stronghold-game:git-$revision"
smoke="stronghold-smoke-$$"
backup="stronghold-game-backup-$$"
replaced=0
had_old=0
cleanup() {
  local status=$?
  trap - EXIT
  docker rm -f "$smoke" >/dev/null 2>&1 || true
  if (( status != 0 && replaced )); then
    docker rm -f stronghold-game >/dev/null 2>&1 || true
    if (( had_old )); then
      docker rename "$backup" stronghold-game
      docker start stronghold-game >/dev/null
      echo 'Update failed; previous game container restored.' >&2
    fi
  fi
  exit "$status"
}
trap cleanup EXIT
DOCKER_BUILDKIT=1 docker build --build-arg NODE_IMAGE=node:24-alpine --build-arg BROWSER_RESOURCES=1 -t "$image" .
# Check the new image before interrupting any running game.
docker run -d --name "$smoke" -e SP_COMBAT=client "$image" >/dev/null
healthy=0
for attempt in {1..30}; do
  if docker exec "$smoke" node -e 'fetch("http://127.0.0.1:3000/healthz").then(async r=>{if(!r.ok||!(await r.json()).ok)process.exit(1)}).catch(()=>process.exit(1))' >/dev/null 2>&1; then healthy=1; break; fi
  sleep 2
done
(( healthy )) || { docker logs "$smoke"; exit 1; }
docker exec "$smoke" node -e 'const fs=require("node:fs");const m=JSON.parse(fs.readFileSync("/app/public/vendor/browser-resources.json"));if(!m.version||!m.files.length)process.exit(1);console.log("Resource version:",m.version,"files:",m.files.length)'
docker rm -f "$smoke" >/dev/null
echo 'New image is healthy. Replacing game server; active matches will end.'
if docker inspect stronghold-game >/dev/null 2>&1; then
  had_old=1
  docker stop stronghold-game >/dev/null
  docker rename stronghold-game "$backup"
fi
replaced=1
docker run -d --name stronghold-game --restart unless-stopped \
  -p 127.0.0.1:3000:3000 -e SP_COMBAT=client "$image" >/dev/null
healthy=0
for attempt in {1..30}; do
  if curl -fsS http://127.0.0.1:3000/healthz; then healthy=1; break; fi
  sleep 2
done
(( healthy )) || { docker logs stronghold-game; exit 1; }
if (( had_old )); then docker rm "$backup" >/dev/null; fi
replaced=0
echo
echo "Deployed $revision. HTTPS settings and certificate volumes were preserved."
