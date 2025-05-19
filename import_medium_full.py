import os
import re
from datetime import datetime
import feedparser
from newspaper import Article
from markdownify import markdownify as md

# ---- CONFIGURE THIS ----
RSS_URL = 'https://medium.com/feed/@dazzled_mint_wildebeest_745'
POSTS_DIR = '_posts'
# ------------------------

feed = feedparser.parse(RSS_URL)

if not os.path.exists(POSTS_DIR):
    os.makedirs(POSTS_DIR)

for entry in feed.entries:
    try:
        # Clean and format title for filename
        title_slug = re.sub(r'[^\w\s-]', '', entry.title).strip().lower()
        title_slug = re.sub(r'[\s_-]+', '-', title_slug)
        date = datetime(*entry.published_parsed[:3]).strftime('%Y-%m-%d')
        filename = f"{POSTS_DIR}/{date}-{title_slug}.md"

        if os.path.exists(filename):
            print(f"⚠️ Skipping duplicate: {filename}")
            continue

        # Extract full article content
        article = Article(entry.link)
        article.download()
        article.parse()
        content = md(article.text)

        # Add some basic tags based on title
        tags = []
        keywords = ['privacy', 'security', 'technology', 'smartphone', 'hack', 'guide', 'walkthrough']
        for kw in keywords:
            if kw in title_slug:
                tags.append(kw)

        with open(filename, 'w') as f:
            f.write(f"---\n")
            f.write(f"title: \"{entry.title}\"\n")
            f.write(f"date: {date}\n")
            f.write(f"layout: post\n")
            f.write(f"external_url: {entry.link}\n")
            if tags:
                f.write(f"tags: [{', '.join(tags)}]\n")
            f.write(f"---\n\n")
            f.write(f"This post originally appeared on [Medium]({entry.link}).\n\n")
            f.write(content)

        print(f"✅ Created: {filename}")
    except Exception as e:
        print(f"❌ Failed to process entry '{entry.title}': {e}")
