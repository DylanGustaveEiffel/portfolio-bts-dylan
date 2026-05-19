"""
backend/server.py — Reverse proxy minimal vers le serveur PHP du portfolio.

POURQUOI ?
L'ingress Kubernetes route /api/* vers le port 8001 (FastAPI) et tout le reste
vers le port 3000 (PHP). Pour que les appels /api/* du portfolio (qui sont
servis par le PHP sur le port 3000) soient accessibles depuis l'URL publique,
on transforme ce backend FastAPI en simple proxy : il transmet chaque requête
/api/* à http://localhost:3000/api/* puis renvoie la réponse au client.

Aucune logique métier ici : tout est dans le PHP (modèles/contrôleurs MVC).
"""
import httpx
from fastapi import FastAPI, Request, Response

PHP_BASE = "http://localhost:3000"

app = FastAPI()
client = httpx.AsyncClient(base_url=PHP_BASE, timeout=30.0)


@app.api_route(
    "/api/{full_path:path}",
    methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
)
async def proxy_api(full_path: str, request: Request):
    """Transfère la requête au backend PHP et renvoie sa réponse telle quelle."""
    url = f"/api/{full_path}"
    if request.url.query:
        url += f"?{request.url.query}"

    headers = {k: v for k, v in request.headers.items()
               if k.lower() not in ("host", "content-length", "connection")}
    body = await request.body()

    try:
        upstream = await client.request(
            method=request.method,
            url=url,
            headers=headers,
            content=body,
        )
    except httpx.RequestError as exc:
        return Response(content=f'{{"erreur":"proxy: {exc}"}}',
                        status_code=502, media_type="application/json")

    # On filtre les headers hop-by-hop
    excluded = {"content-encoding", "transfer-encoding", "connection",
                "keep-alive", "content-length"}
    out_headers = {k: v for k, v in upstream.headers.items()
                   if k.lower() not in excluded}
    return Response(content=upstream.content,
                    status_code=upstream.status_code,
                    headers=out_headers,
                    media_type=upstream.headers.get("content-type"))


@app.get("/api")
async def api_root():
    return {"service": "portfolio-php-proxy", "ok": True}


@app.on_event("shutdown")
async def _close():
    await client.aclose()
