import importlib.util
from pathlib import Path
import unittest


PATH = Path(__file__).resolve().parents[1] / "scripts/devops_progress.py"
SPEC = importlib.util.spec_from_file_location("devops_progress", PATH)
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class DevOpsProgressTests(unittest.TestCase):
    def config(self):
        return {"organization": "https://dev.azure.com/rpa-automatic",
                "project": "RPA Automatic", "project_id": "project-id",
                "page_root": "/portal-orchestrator-ai", "epic_id": 87}

    def epic(self, revision=6):
        return {"id": 87, "rev": revision, "fields": {
            "System.TeamProject": "RPA Automatic", "System.WorkItemType": "Epic",
            "System.Tags": "portal-orchestrator-ai", "System.Title": "Portal Orchestrator AI"}}

    def test_duplicate_marker_is_unchanged(self):
        calls = []
        marker = "[portal-orchestrator-ai:" + "a" * 40 + "]"

        def transport(method, url, auth, data=None, content_type="application/json"):
            calls.append((method, url))
            if "wit/workitems/87?" in url and "%24expand=all" in url:
                return self.epic()
            if "/updates?" in url:
                return {"value": [{"fields": {"System.History": {"newValue": marker}}}]}
            self.fail("Não deveria escrever checkpoint duplicado")

        client = MODULE.Client(self.config(), auth="Bearer synthetic", transport=transport)
        result = client.apply({"revision": 5, "marker": marker, "history": "history"})
        self.assertEqual(result["result"], "unchanged")
        self.assertFalse(any(method == "PATCH" for method, _ in calls))

    def test_revision_conflict_blocks_before_write(self):
        def transport(method, url, auth, data=None, content_type="application/json"):
            if method == "GET":
                return self.epic(7)
            self.fail("Conflito não pode escrever")

        client = MODULE.Client(self.config(), auth="Bearer synthetic", transport=transport)
        with self.assertRaisesRegex(MODULE.DevOpsError, "Conflito de revisão"):
            client.apply({"revision": 6, "marker": "marker", "history": "history"})


if __name__ == "__main__":
    unittest.main()
