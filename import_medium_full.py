import feedparser
from newspaper import Article
from markdownify import markdownify as md
from datetime import datetime
import os
import re

# ---- CONFIGURE THIS ----
RSS_URL = 'https://medium.com/feed/@dazzled_mint_wildebeest_745'
POSTS_DIR = '_posts'
# ------------------------

feed = feedparser.parse(RSS_URL)

print(f"📰 Found {len(feed.entries)} Medium post(s)")

for entry in feed.entries:
    title = re.sub(r'[^\w\s-]', '', entry.title).strip().lower()
    title = re.sub(r'[\s_-]+', '-', title)
    date = datetime(*entry.published_parsed[:3]).strftime('%Y-%m-%d')
    filename = f"{POSTS_DIR}/{date}-{title}.md"

    if os.path.exists(filename):
        print(f"⚠️ Skipped: {filename} (already exists)")
        continue

    print(f"\n⏳ Processing: {entry.link}")

    try:
        article = Article(entry.link)
        article.download()
        article.parse()
        print("✅ Downloaded and parsed")

        markdown = md(article.text)

        with open(filename, 'w', encoding='utf-8') as f:
            f.write(f"---\n")
            f.write(f"title: \"{entry.title}\"\n")
            f.write(f"date: {date}\n")
            f.write(f"layout: post\n")
            f.write(f"original_url: {entry.link}\n")
            f.write(f"---\n\n")
            f.write(f"*Originally published on [Medium]({entry.link}).*\n\n")
            f.write(markdown.strip())

        print(f"✅ Created: {filename}")
    except Exception as e:
        print(f"❌ Failed to process {entry.link}: {e}")
