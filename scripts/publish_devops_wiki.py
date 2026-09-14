#!/usr/bin/env python3
"""Executa o publicador comum com a configuração do Portal Orchestrator AI."""

from pathlib import Path
import os
import runpy


ROOT = Path(__file__).resolve().parents[1]
PUBLISHER = ROOT.parent / "portal-faturamento/scripts/publish_devops_wiki.py"
if not PUBLISHER.is_file():
    raise SystemExit(
        "Publicador comum não encontrado em ../portal-faturamento/scripts/publish_devops_wiki.py"
    )
cli_wrapper = ROOT.parent / "solution-design-architecture-agent/scripts/azure-cli.sh"
if "AZURE_CLI_WRAPPER" not in os.environ and cli_wrapper.is_file():
    os.environ["AZURE_CLI_WRAPPER"] = str(cli_wrapper)
runpy.run_path(str(PUBLISHER), run_name="__main__")
