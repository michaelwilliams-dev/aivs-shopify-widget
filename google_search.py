import os
import requests

def fetch_google_news(query, num_results=3):
    API_KEY = os.getenv("GOOGLE_API_KEY")
    CSE_ID = os.getenv("GOOGLE_CSE_ID")

    print("🔑 API key present?", bool(API_KEY))
    print("🔍 CSE ID present?", bool(CSE_ID))

    params = {
        'key': API_KEY,
        'cx': CSE_ID,
        'q': query,
        'num': num_results
    }

    try:
        response = requests.get("https://www.googleapis.com/customsearch/v1", params=params)
        response.raise_for_status()
        data = response.json()

        items = data.get("items", [])
        results = []
        for item in items:
            title = item.get("title", "")
            snippet = item.get("snippet", "")
            link = item.get("link", "")
            results.append(f"• {title}\n  {snippet}\n  {link}")

        return results or ["No Google search results found."]
    
    except Exception as e:
        print("❌ Google Search API failed:", e)
        return ["Error fetching Google search results."]

# 🔍 Now run the test
query = "VAT changes concerning marshmallows site:gov.uk"
print("\n".join(fetch_google_news(query)))