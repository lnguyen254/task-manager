# Deploying to a server (manual)

This project ships as a Docker Compose stack (`postgres`, `api`, `web`), each app built
from its own multi-stage Dockerfile. Deploys are manual: SSH in, `git pull`, rebuild.

## Prerequisites (one-time, on the server)

- Linux server with SSH access.
- Docker and Docker Compose installed (`docker --version && docker compose version`).
- A domain's DNS **A record** pointed at the server's IP, if you want a real hostname
  instead of `http://<server-ip>:3001`.
- Ports `22`, `80`, `443` open in the firewall; `3000`/`3001` closed to the outside
  world (Nginx is the only public entry point — see below).

## 1. Get the code onto the server

```bash
git clone <your-repo-url> task-manager
cd task-manager
```

## 2. Configure `.env`

```bash
cp .env.example .env
```

Edit `.env` and set real values — **do not use the `.env.example` defaults in
production**:

- `POSTGRES_PASSWORD` — a strong, unique password.
- `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` — distinct random secrets:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
- `CORS_ORIGIN` — the public origin the browser will use, e.g. `https://yourdomain.com`.

`API_INTERNAL_URL` stays `http://api:3000` — that's Docker-internal traffic between
`web` and `api` and is unrelated to the public domain.

## 3. Restrict the `api` service to localhost

The browser only ever talks to `web` (see the BFF pattern in the root `README.md`), so
`api`'s host port doesn't need to be reachable from outside the server. In
`docker-compose.yml`, bind it to loopback only:

```yaml
  api:
    ports:
      - "127.0.0.1:3000:3000"
```

## 4. Build and start the stack

```bash
docker compose up -d --build
docker compose ps            # all three services should report healthy
docker compose logs -f api   # confirm migrations ran, then Ctrl+C
```

`api` runs `prisma migrate deploy` on startup before serving traffic, and only reports
healthy once `GET /health` confirms real database connectivity; `web` waits for `api`
to be healthy before starting.

## 5. Put Nginx + Let's Encrypt in front (domain + HTTPS)

```bash
sudo apt update && sudo apt install -y nginx certbot python3-certbot-nginx
```

`/etc/nginx/sites-available/task-manager`:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/task-manager /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d yourdomain.com   # rewrites the config for HTTPS + sets up auto-renewal
```

## 6. Lock down the firewall

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

With `api` bound to loopback (step 3) and `web` only reachable via Nginx, only
22/80/443 need to be open.

## 7. Verify

- `https://yourdomain.com` loads the app.
- Register/login succeeds and sets the session cookie.
- `docker compose logs -f` shows no errors.

## Redeploying after changes

```bash
cd task-manager
git pull
docker compose up -d --build
```

Migrations re-run automatically as part of `api`'s container startup — no manual
migration step needed.
