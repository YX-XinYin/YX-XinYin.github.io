from scholarly import scholarly
import json
from datetime import datetime
import os
import sys


def main() -> int:
    scholar_id = os.environ.get("GOOGLE_SCHOLAR_ID")
    if not scholar_id:
        print("GOOGLE_SCHOLAR_ID is not set", file=sys.stderr)
        return 1

    try:
        author: dict = scholarly.search_author_id(scholar_id)
        scholarly.fill(author, sections=["basics", "indices", "counts", "publications"])
    except Exception as exc:
        # Common on GitHub Actions: CAPTCHA / IP block from Google Scholar.
        print(f"Failed to fetch Google Scholar data: {exc}", file=sys.stderr)
        return 1

    author["updated"] = str(datetime.now())
    author["publications"] = {v["author_pub_id"]: v for v in author["publications"]}
    print(json.dumps(author, indent=2))
    os.makedirs("results", exist_ok=True)
    with open("results/gs_data.json", "w") as outfile:
        json.dump(author, outfile, ensure_ascii=False)

    shieldio_data = {
        "schemaVersion": 1,
        "label": "citations",
        "message": f"{author['citedby']}",
    }
    with open("results/gs_data_shieldsio.json", "w") as outfile:
        json.dump(shieldio_data, outfile, ensure_ascii=False)
    return 0


if __name__ == "__main__":
    sys.exit(main())
