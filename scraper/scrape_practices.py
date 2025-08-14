import os, re, json, time
import requests
from urllib.parse import urljoin
from bs4 import BeautifulSoup

SERPAPI_KEY = os.getenv("SERPAPI_KEY")
EMAIL_RE = re.compile(r"[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}", re.I)

# ---- helpers ----

def serpapi_gmaps(query, location, num=20):
    url = "https://serpapi.com/search.json"
    params = {
        "engine": "google_maps", "type": "search",
        "q": query, "location": location, "api_key": SERPAPI_KEY
    }
    r = requests.get(url, params=params, timeout=30)
    r.raise_for_status()
    data = r.json()
    results = []
    for item in data.get("local_results", [])[:num]:
        results.append({
            "name": item.get("title"),
            "website": item.get("website"),
            "phone": item.get("phone"),
            "address": item.get("address")
        })
    return results

VISIT_HINTS = ["/contact", "/contact-us", "/about", "/appointments", "/locations"]


def fetch(url):
    try:
        r = requests.get(url, timeout=20, headers={"User-Agent": "Mozilla/5.0"})
        if r.ok:
            return r.text
    except Exception:
        return None
    return None


def harvest_emails(site):
    emails = set(EMAIL_RE.findall(site or ""))
    return {e.lower() for e in emails if not e.lower().endswith((".png", ".jpg"))}


def crawl_site(base_url):
    pages = set()
    html = fetch(base_url)
    if html:
        pages.add(html)
    for hint in VISIT_HINTS:
        sub = urljoin(base_url, hint)
        html = fetch(sub)
        if html:
            pages.add(html)
            time.sleep(1)
    found = set()
    for page in pages:
        found |= harvest_emails(page)
    return list(found)


def main():
    import argparse
    ap = argparse.ArgumentParser()
    ap.add_argument("--query", default="dentist")
    ap.add_argument("--location", default="San Diego, CA")
    ap.add_argument("--limit", type=int, default=30)
    ap.add_argument("--out", default="leads.jsonl")
    args = ap.parse_args()

    practices = serpapi_gmaps(args.query, args.location, num=args.limit)
    with open(args.out, "w") as f:
        for p in practices:
            site = p.get("website")
            emails = crawl_site(site) if site else []
            for e in emails:
                rec = {
                    "company": p.get("name"),
                    "website": site,
                    "phone": p.get("phone"),
                    "address": p.get("address"),
                    "email": e,
                    "source": "scraper:serpapi"
                }
                f.write(json.dumps(rec) + "\n")
    print(f"Wrote {args.out}")

if __name__ == "__main__":
    main()