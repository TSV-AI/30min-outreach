import os, re, json, time
import requests
from urllib.parse import urljoin
from bs4 import BeautifulSoup

SERPAPI_KEY = os.getenv("SERPAPI_KEY")
EMAIL_RE = re.compile(r"[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}", re.I)

# ---- helpers ----

def serpapi_gmaps(query, location, num=20):
    url = "https://serpapi.com/search.json"
    
    # Improve location targeting by adding city/state to query
    enhanced_query = f"{query} in {location}"
    
    params = {
        "engine": "google_maps", 
        "type": "search",
        "q": enhanced_query,
        "location": location, 
        "api_key": SERPAPI_KEY
    }
    
    print(f"🌐 SerpAPI Query: {enhanced_query}")
    print(f"📍 SerpAPI Location: {location}")
    
    r = requests.get(url, params=params, timeout=30)
    r.raise_for_status()
    data = r.json()
    
    results = []
    for item in data.get("local_results", [])[:num]:
        address = item.get("address", "")
        results.append({
            "name": item.get("title"),
            "website": item.get("website"),
            "phone": item.get("phone"),
            "address": address
        })
        print(f"🏢 Found: {item.get('title')} - {address}")
    
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

    print(f"🔍 Searching for {args.query} in {args.location}")
    practices = serpapi_gmaps(args.query, args.location, num=args.limit)
    
    # Filter results to keep only businesses that mention the target location
    location_keywords = args.location.lower().replace(",", "").split()
    filtered_practices = []
    
    for practice in practices:
        address = practice.get("address", "").lower()
        # Keep if address contains any of the location keywords
        if any(keyword in address for keyword in location_keywords):
            filtered_practices.append(practice)
        else:
            print(f"🚫 Filtered out: {practice.get('name')} - {practice.get('address')} (not in target location)")
    
    practices = filtered_practices
    print(f"📍 Found {len(practices)} businesses in {args.location} (after location filtering)")
    
    total_leads = 0
    with open(args.out, "w") as f:
        for i, p in enumerate(practices, 1):
            company_name = p.get("name", "Unknown")
            print(f"🏢 [{i}/{len(practices)}] Scraping: {company_name}")
            
            site = p.get("website")
            if site:
                emails = crawl_site(site)
                print(f"📧 Found {len(emails)} emails for {company_name}")
            else:
                emails = []
                print(f"❌ No website for {company_name}")
            
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
                total_leads += 1
                print(f"✅ Lead #{total_leads}: {e} @ {company_name}")
    
    print(f"🎉 Completed! Total leads found: {total_leads}")
    print(f"Wrote {args.out}")

if __name__ == "__main__":
    main()