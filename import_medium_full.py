import feedparser
from newspaper import Article
import os
import re
from datetime import datetime
from markdownify import markdownify as md

RSS_URL = "https://medium.com/feed/@your_username"  # Replace this
POSTS_DIR = "_posts"

feed = feedparser.parse(RSS_URL)

for entry in feed.entries:
    date = datetime(*entry.published_parsed[:3]).strftime('%Y-%m-%d')
    title_slug = re.sub(r'[^\w\s-]', '', entry.title).strip().lower()
    title_slug = re.sub(r'[\s_-]+', '-', title_slug)
    filename = f"{POSTS_DIR}/{date}-{title_slug}.md"

    if os.path.exists(filename):
        print(f"⚠️ Skipping: {filename} (already exists)")
        continue

    # Scrape the article from Medium
    article = Article(entry.link)
    article.download()
    article.parse()

    content_md = md(article.text)

    with open(filename, 'w') as f:
        f.write(f"---\n")
        f.write(f"title: \"{entry.title}\"\n")
        f.write(f"date: {date}\n")
        f.write(f"layout: post\n")
        f.write(f"---\n\n")
        f.write(content_md)

    print(f"✅ Created: {filename}")
