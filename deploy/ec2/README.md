# Manual EC2 updates

GitHub pushes do not deploy automatically. Run the update command on EC2 when you want to publish the latest `master` revision. Replacing the game process ends active rooms and matches.

## Switch the existing installation

The existing Docker installation and Caddy HTTPS container must already work. Ubuntu 24.04 and x86 Docker with Buildx are expected. The script leaves `/opt/stronghold/Caddyfile` and Caddy certificate volumes unchanged.

On the EC2 Ubuntu terminal:

```bash
curl -fL https://raw.githubusercontent.com/moring-m/Stronghold-Protocol_Ko_Arca/master/deploy/ec2/update.sh -o /tmp/stronghold-update.sh
sudo bash /tmp/stronghold-update.sh
```

The script clones the public repository into `/opt/stronghold-git/source`. It downloads source and resource metadata, builds the game image, verifies health and the browser resource index, then replaces `stronghold-game`. Failed startup restores the previous container. Failed builds leave the running game untouched. The previous process's rooms cannot be recovered after replacement or rollback.

## Later updates

After committing and pushing code to GitHub, run manually on EC2:

```bash
sudo bash /opt/stronghold-git/source/deploy/ec2/update.sh
```

The updater pulls `master` with `--ff-only`, refuses local modifications or an unexpected remote, and runs the updater from the new revision. There is no cron, webhook, or GitHub Actions deployment. Root-owned checkout commands should also be run with `sudo`.

Browser resources are prepared at Docker build time with `BROWSER_RESOURCES=1`. Game art stays in the browser cache and is not added to the image. Keeping the same HTTPS domain and resource version preserves the art cache. A game code update alone does not intentionally change the resource version.

## Checks and disk usage

```bash
sudo docker ps
curl -fsS http://127.0.0.1:3000/healthz
sudo docker stats --no-stream
df -h /
```

Older tagged images are retained. On a small disk, review `sudo docker system df` and remove specific obsolete image tags when needed. Do not remove Caddy's data volumes. Building on a 1 GB instance can be slow or fail under memory pressure; health checks protect the running deployment from a failed build but cannot prevent resource contention.
