# ***Vibe Coded*** - RSS Feed Aggregator

A simple, automated RSS feed aggregator that fetches content from multiple sources and displays them on a clean, static website. Stay informed without the social media noise.

## Features

- **Automated Updates**: GitHub Actions fetches feeds every hour
- **Multiple Sources**: Supports any RSS/Atom feed (Reddit, Hacker News, blogs, news sites)
- **Clean Interface**: Simple, distraction-free reading experience
- **Dark Mode**: Toggle between light and dark themes
- **Search & Filter**: Find articles by keyword or source
- **Fast & Free**: Serverless architecture using GitHub Pages
- **Custom Domain**: Use your own subdomain (e.g., rss.yourdomain.com)

## Architecture

```
GitHub Actions (hourly cron)
    ↓
Python script fetches RSS feeds
    ↓
Updates feeds.json
    ↓
Commits to repository
    ↓
GitHub Pages serves static site
    ↓
Your custom domain
```

## Setup Instructions

### 1. Fork/Clone This Repository

```bash
git clone <your-repo-url>
cd rss
```

### 2. Configure Your RSS Sources

Edit `config/sources.json` to add your preferred sources:

```json
{
  "sources": [
    {
      "name": "Hacker News",
      "url": "https://news.ycombinator.com/rss",
      "category": "tech"
    },
    {
      "name": "r/programming",
      "url": "https://www.reddit.com/r/programming/.rss",
      "category": "reddit"
    }
  ]
}
```

**Finding RSS Feeds:**
- **Reddit**: `https://www.reddit.com/r/SUBREDDIT/.rss`
- **Hacker News**: `https://news.ycombinator.com/rss`
- **Most blogs/news sites**: Look for RSS icon or `/feed`, `/rss`, `/atom` endpoints

### 3. Test Locally (Optional)

```bash
# Install uv if you don't have it
curl -LsSf https://astral.sh/uv/install.sh | sh

# Install dependencies
uv pip install -r scripts/requirements.txt

# Run the fetcher
uv run python scripts/fetch_feeds.py

# Serve locally
cd docs
python -m http.server 8000
# Visit http://localhost:8000
```

### 4. Enable GitHub Pages

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Pages**
3. Under **Source**, select:
   - **Branch**: `main`
   - **Folder**: `/docs`
4. Click **Save**

Your site will be available at: `https://your-username.github.io/rss/`

### 5. Set Up Custom Domain (Optional)

#### Add Custom Domain to GitHub Pages

1. In **Settings** → **Pages** → **Custom domain**
2. Enter your subdomain (e.g., `rss.yourdomain.com`)
3. Click **Save** (this creates a `CNAME` file)
4. Enable **Enforce HTTPS** (wait a few minutes for certificate)

#### Configure DNS

Add a CNAME record to your DNS provider:

- **Type**: CNAME
- **Name**: `rss` (or your preferred subdomain)
- **Value**: `your-username.github.io`
- **TTL**: 3600 (or auto)

**Example DNS providers:**
- Cloudflare: DNS → Add Record
- Namecheap: Advanced DNS → Add New Record
- Google Domains: DNS → Custom Records

Wait 5-60 minutes for DNS propagation.

### 6. Enable GitHub Actions

The workflow is already configured in `.github/workflows/fetch-rss.yml`.

**To enable:**
1. Push your repository to GitHub
2. Go to **Settings** → **Actions** → **General**
3. Under **Workflow permissions**, select:
   - ✅ **Read and write permissions**
4. Click **Save**

**Manual trigger:**
1. Go to **Actions** tab
2. Click **Fetch RSS Feeds** workflow
3. Click **Run workflow**

The workflow runs automatically every hour.

## Project Structure

```
.
├── .github/
│   └── workflows/
│       └── fetch-rss.yml      # GitHub Actions workflow
├── config/
│   └── sources.json           # Your RSS feed sources
├── docs/                      # GitHub Pages root
│   ├── index.html             # Main page
│   ├── style.css              # Styling
│   ├── app.js                 # Frontend logic
│   └── feeds.json             # Generated feed data (auto-created)
├── scripts/
│   ├── fetch_feeds.py         # RSS fetcher script
│   └── requirements.txt       # Python dependencies
└── README.md
```

## Customization

### Change Update Frequency

Edit `.github/workflows/fetch-rss.yml`:

```yaml
schedule:
  - cron: '0 * * * *'  # Every hour
  # - cron: '*/30 * * * *'  # Every 30 minutes
  # - cron: '0 */6 * * *'  # Every 6 hours
```

### Change Maximum Items

Edit `scripts/fetch_feeds.py`:

```python
MAX_ITEMS = 200  # Change to desired number
```

### Styling

Customize colors in `docs/style.css`:

```css
:root {
    --accent-color: #0066cc;  /* Change to your preferred color */
}
```

## Troubleshooting

### GitHub Actions Not Running

- Check **Settings** → **Actions** → **General** → Workflow permissions
- Ensure "Read and write permissions" is enabled

### Feeds Not Updating

- Check **Actions** tab for errors
- Verify RSS URLs are correct in `config/sources.json`
- Some feeds may be blocked by CORS (GitHub Actions fetches from server-side, so this shouldn't be an issue)

### Custom Domain Not Working

- Wait 5-60 minutes for DNS propagation
- Verify CNAME record points to `your-username.github.io`
- Check GitHub Pages settings show your custom domain

### Feed Parse Errors

- Ensure RSS URLs are valid
- Check Actions logs for specific errors
- Some feeds may require user-agent headers (script handles this)

## Contributing

Feel free to submit issues or pull requests to improve the aggregator!

## License

MIT License - Feel free to use and modify for your own purposes.

## Acknowledgments

Built with:
- [feedparser](https://feedparser.readthedocs.io/) - RSS/Atom feed parser
- [uv](https://github.com/astral-sh/uv) - Fast Python package installer
- GitHub Actions & Pages - Free hosting and automation
