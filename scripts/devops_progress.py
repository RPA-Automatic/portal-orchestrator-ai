#!/usr/bin/env python3
"""Consulta o Épico do portal e registra checkpoints idempotentes; padrão: somente plano."""

import argparse
import base64
from datetime import datetime, timezone
from html import escape
import json
import os
from pathlib import Path
import re
import subprocess
from urllib.error import HTTPError, URLError
from urllib.parse import quote, urlencode
from urllib.request import Request, build_opener, HTTPRedirectHandler


ROOT = Path(__file__).resolve().parents[1]


class DevOpsError(RuntimeError):
    pass


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def authorization():
    if token := os.getenv("AZURE_DEVOPS_BEARER_TOKEN"):
        return "Bearer " + token
    if token := os.getenv("AZURE_DEVOPS_PAT"):
        return "Basic " + base64.b64encode((":" + token).encode()).decode()
    wrapper = os.getenv("AZURE_CLI_WRAPPER")
    commands = []
    if wrapper:
        commands.append(["bash", wrapper])
    commands.append(["az"])
    sibling = ROOT.parent / "solution-design-architecture-agent/scripts/azure-cli.sh"
    if sibling.is_file():
        commands.append(["bash", str(sibling)])
    for command in commands:
        try:
            token = subprocess.check_output(
                command + ["account", "get-access-token", "--resource",
                           "499b84ac-1321-427f-aa17-267ca6975798",
                           "--query", "accessToken", "-o", "tsv"],
                stderr=subprocess.DEVNULL, text=True, timeout=45,
            ).strip()
            if token:
                return "Bearer " + token
        except (OSError, subprocess.CalledProcessError, subprocess.TimeoutExpired):
            continue
    raise DevOpsError("Autentique o Azure CLI ou configure credencial fora do chat.")


def request_json(method, url, auth, data=None, content_type="application/json"):
    payload = None if data is None else json.dumps(data).encode()
    request = Request(url, method=method, data=payload, headers={
        "Authorization": auth, "Content-Type": content_type, "Accept": "application/json",
    })
    try:
        with build_opener(NoRedirect()).open(request, timeout=45) as response:
            return json.load(response)
    except HTTPError as exc:
        raise DevOpsError(f"HTTP {exc.code}; releia o destino antes de repetir.") from None
    except (URLError, TimeoutError):
        raise DevOpsError("Falha de transporte; consulte o destino antes de repetir escrita.") from None


def load_config(path):
    config = json.loads(Path(path).read_text())
    if not re.fullmatch(r"https://dev\.azure\.com/[A-Za-z0-9-]+", config["organization"]):
        raise DevOpsError("Organização inválida.")
    if not isinstance(config.get("epic_id"), int) or config["epic_id"] <= 0:
        raise DevOpsError("Épico inválido.")
    for key in ("project", "project_id", "page_root"):
        if not isinstance(config.get(key), str) or not config[key].strip():
            raise DevOpsError("Configuração incompleta: " + key)
    return config


class Client:
    def __init__(self, config, auth=None, transport=request_json):
        self.config = config
        self.auth = auth or authorization()
        self.transport = transport
        self.base = (config["organization"] + "/" + quote(config["project"], safe="") +
                     "/_apis/")

    def call(self, method, path, data=None, params=None, patch=False):
        query = urlencode({"api-version": "7.1", **(params or {})})
        return self.transport(method, self.base + path + "?" + query, self.auth, data,
                              "application/json-patch+json" if patch else "application/json")

    def epic(self):
        item = self.call("GET", f"wit/workitems/{self.config['epic_id']}",
                         params={"$expand": "all"})
        fields = item.get("fields", {})
        if (fields.get("System.TeamProject") != self.config["project"] or
                fields.get("System.WorkItemType") != "Epic" or
                "portal-orchestrator-ai" not in fields.get("System.Tags", "")):
            raise DevOpsError("O Épico não corresponde ao Portal Orchestrator configurado.")
        return item

    def children(self):
        wiql = {"query": "SELECT [System.Id] FROM WorkItems WHERE "
                 f"[System.TeamProject] = '{self.config['project'].replace("'", "''")}' AND "
                 f"[System.Parent] = {self.config['epic_id']} ORDER BY [System.ChangedDate] DESC"}
        result = self.call("POST", "wit/wiql", wiql)
        ids = [item["id"] for item in result.get("workItems", [])]
        if not ids:
            return []
        return self.call("POST", "wit/workitemsbatch", {"ids": ids, "errorPolicy": "Fail"}).get("value", [])

    def updates(self):
        return self.call("GET", f"wit/workitems/{self.config['epic_id']}/updates").get("value", [])

    def apply(self, plan):
        epic = self.epic()
        if any(plan["marker"] in str(update.get("fields", {}).get("System.History", {}))
               for update in self.updates()):
            return {"id": epic["id"], "revision": epic["rev"], "result": "unchanged",
                    "marker": plan["marker"]}
        if epic["rev"] != plan["revision"]:
            raise DevOpsError("Conflito de revisão: releia o Épico e gere outro plano.")
        patch = [
            {"op": "test", "path": "/rev", "value": plan["revision"]},
            {"op": "add", "path": "/fields/System.History", "value": plan["history"]},
        ]
        result = self.call("PATCH", f"wit/workitems/{epic['id']}", patch, patch=True)
        if result.get("rev") != plan["revision"] + 1:
            raise DevOpsError("A revisão retornada não corresponde ao checkpoint aplicado.")
        return {"id": result["id"], "revision": result["rev"], "result": "updated",
                "marker": plan["marker"]}


def validate_commit(commit):
    if not re.fullmatch(r"[0-9a-f]{40}", commit):
        raise DevOpsError("Informe o SHA completo do commit.")
    checks = [
        ["git", "cat-file", "-e", commit + "^{commit}"],
        ["git", "merge-base", "--is-ancestor", commit, "origin/main"],
    ]
    for command in checks:
        if subprocess.run(command, cwd=ROOT, stdout=subprocess.DEVNULL,
                          stderr=subprocess.DEVNULL).returncode:
            raise DevOpsError("O commit precisa existir e já estar publicado em origin/main.")


def build_history(args, marker):
    details = "".join(f"<li>{escape(value)}</li>" for value in args.detail)
    validations = "".join(f"<li>{escape(value)}</li>" for value in args.validation)
    return (
        f"<p><strong>Checkpoint do Portal Orchestrator AI</strong></p>"
        f"<p>{escape(args.summary)}</p>"
        f"<p><strong>Entregas</strong></p><ul>{details}</ul>"
        f"<p><strong>Validações</strong></p><ul>{validations}</ul>"
        f"<p><strong>Commit</strong>: <code>{escape(args.commit)}</code></p>"
        f"<p><strong>Próximo passo</strong>: {escape(args.next)}</p>"
        f"<p><small>{escape(marker)}</small></p>"
    )


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--config", default=str(ROOT / "azure-devops/config.json"))
    commands = parser.add_subparsers(dest="command", required=True)
    commands.add_parser("status")
    plan = commands.add_parser("plan")
    plan.add_argument("--summary", required=True)
    plan.add_argument("--detail", action="append", required=True)
    plan.add_argument("--validation", action="append", required=True)
    plan.add_argument("--commit", required=True)
    plan.add_argument("--next", required=True)
    plan.add_argument("--out", required=True)
    apply = commands.add_parser("apply")
    apply.add_argument("--plan", required=True)
    apply.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    config = load_config(args.config)
    client = Client(config)
    if args.command == "status":
        epic = client.epic()
        children = client.children()
        print(json.dumps({
            "queried_at": datetime.now(timezone.utc).isoformat(),
            "epic": {"id": epic["id"], "revision": epic["rev"],
                     "title": epic["fields"].get("System.Title"),
                     "state": epic["fields"].get("System.State"),
                     "board_column": epic["fields"].get("System.BoardColumn")},
            "children": [{"id": item["id"], "type": item["fields"].get("System.WorkItemType"),
                          "title": item["fields"].get("System.Title"),
                          "state": item["fields"].get("System.State")} for item in children],
        }, ensure_ascii=False, indent=2))
        return
    if args.command == "plan":
        validate_commit(args.commit)
        epic = client.epic()
        marker = "[portal-orchestrator-ai:" + args.commit + "]"
        result = {"organization": config["organization"], "project": config["project"],
                  "project_id": config["project_id"], "epic_id": config["epic_id"],
                  "revision": epic["rev"], "marker": marker,
                  "history": build_history(args, marker)}
        output = Path(args.out)
        output.parent.mkdir(parents=True, exist_ok=True)
        with output.open("x") as stream:
            json.dump(result, stream, ensure_ascii=False, indent=2)
        print(json.dumps({"mode": "plan", "out": str(output), "epic_id": epic["id"],
                          "revision": epic["rev"], "marker": marker}, ensure_ascii=False, indent=2))
        return
    plan_data = json.loads(Path(args.plan).read_text())
    expected = {key: config[key] for key in ("organization", "project", "project_id", "epic_id")}
    if any(plan_data.get(key) != value for key, value in expected.items()):
        raise DevOpsError("O plano não corresponde ao destino configurado.")
    if not args.apply:
        print(json.dumps({"mode": "dry-run", "plan": plan_data}, ensure_ascii=False, indent=2))
        return
    print(json.dumps(client.apply(plan_data), ensure_ascii=False, indent=2))


if __name__ == "__main__":
    try:
        main()
    except (DevOpsError, KeyError, OSError, ValueError, json.JSONDecodeError) as exc:
        raise SystemExit("Erro: " + str(exc)) from None
