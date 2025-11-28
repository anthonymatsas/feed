#!/usr/bin/env python3
"""
RSS Feed Aggregator
Fetches RSS feeds from configured sources and generates a JSON file for the frontend.
"""

import feedparser
import json
import hashlib
from datetime import datetime
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import List, Dict, Any

# Paths
SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
CONFIG_FILE = PROJECT_ROOT / "config" / "sources.json"
OUTPUT_FILE = PROJECT_ROOT / "docs" / "feeds.json"

# Configuration
MAX_ITEMS = 200  # Maximum number of items to keep in the output
MAX_WORKERS = 10  # Number of parallel feed fetchers


def load_sources() -> List[Dict[str, str]]:
    """Load RSS feed sources from config file."""
    try:
        with open(CONFIG_FILE, 'r') as f:
            config = json.load(f)
            return config.get('sources', [])
    except FileNotFoundError:
        print(f"Error: Config file not found at {CONFIG_FILE}")
        return []
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON in config file: {e}")
        return []


def generate_id(link: str, title: str) -> str:
    """Generate a unique ID for an item based on link and title."""
    content = f"{link}{title}"
    return hashlib.md5(content.encode()).hexdigest()


def fetch_feed(source: Dict[str, str]) -> List[Dict[str, Any]]:
    """Fetch and parse a single RSS feed."""
    name = source.get('name', 'Unknown')
    url = source.get('url', '')
    category = source.get('category', 'general')

    if not url:
        print(f"Skipping {name}: No URL provided")
        return []

    print(f"Fetching {name}...")

    try:
        feed = feedparser.parse(url)

        if feed.bozo:
            print(f"Warning: {name} feed may have issues: {feed.bozo_exception}")

        items = []
        for entry in feed.entries[:50]:  # Limit to 50 items per feed
            # Extract data with fallbacks
            title = entry.get('title', 'No title')
            link = entry.get('link', '')
            comments_link = entry.get('comments', '')

            # Try multiple date fields
            published = None
            for date_field in ['published_parsed', 'updated_parsed', 'created_parsed']:
                if hasattr(entry, date_field):
                    date_tuple = getattr(entry, date_field)
                    if date_tuple:
                        try:
                            published = datetime(*date_tuple[:6]).isoformat() + 'Z'
                            break
                        except (TypeError, ValueError):
                            continue

            # Use current time if no date found
            if not published:
                published = datetime.utcnow().isoformat() + 'Z'

            if link:
                item = {
                    'title': title,
                    'link': link,
                    'source': name,
                    'category': category,
                    'published': published,
                    'id': generate_id(link, title)
                }
                # Add comments link if available (for HackerNews, Reddit, etc.)
                if comments_link:
                    item['comments'] = comments_link
                items.append(item)

        print(f"✓ {name}: {len(items)} items")
        return items

    except Exception as e:
        print(f"✗ {name}: Error - {str(e)}")
        return []


def fetch_all_feeds(sources: List[Dict[str, str]]) -> List[Dict[str, Any]]:
    """Fetch all feeds in parallel."""
    all_items = []

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        future_to_source = {executor.submit(fetch_feed, source): source for source in sources}

        for future in as_completed(future_to_source):
            items = future.result()
            all_items.extend(items)

    return all_items


def deduplicate_items(items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Remove duplicate items based on ID."""
    seen_ids = set()
    unique_items = []

    for item in items:
        if item['id'] not in seen_ids:
            seen_ids.add(item['id'])
            unique_items.append(item)

    return unique_items


def sort_items(items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Sort items by published date (newest first)."""
    return sorted(items, key=lambda x: x['published'], reverse=True)


def save_output(items: List[Dict[str, Any]]) -> None:
    """Save items to JSON file."""
    output_data = {
        'last_updated': datetime.utcnow().isoformat() + 'Z',
        'items': items[:MAX_ITEMS]  # Limit to MAX_ITEMS
    }

    # Ensure output directory exists
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)

    with open(OUTPUT_FILE, 'w') as f:
        json.dump(output_data, f, indent=2)

    print(f"\n✓ Saved {len(items[:MAX_ITEMS])} items to {OUTPUT_FILE}")


def main():
    """Main execution function."""
    print("RSS Feed Aggregator")
    print("=" * 50)

    # Load sources
    sources = load_sources()
    if not sources:
        print("No sources configured. Please add sources to config/sources.json")
        return

    print(f"Loaded {len(sources)} sources\n")

    # Fetch all feeds
    all_items = fetch_all_feeds(sources)
    print(f"\nTotal items fetched: {len(all_items)}")

    # Deduplicate
    unique_items = deduplicate_items(all_items)
    print(f"Unique items: {len(unique_items)}")

    # Sort by date
    sorted_items = sort_items(unique_items)

    # Save output
    save_output(sorted_items)

    print("=" * 50)
    print("Done!")


if __name__ == "__main__":
    main()
