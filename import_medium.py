import feedparser
import html2text
import os
from datetime import datetime

RSS_FEED = "https://medium.com/feed/@dazzled_mint_wildebeest_745"
POSTS_DIR = "_posts"

feed = feedparser.parse(RSS_FEED)
markdowner = html2text.HTML2Text()
markdowner.ignore_links = False

for entry in feed.entries:
    date = datetime(*entry.published_parsed[:6])
    title_slug = entry.title.replace(" ", "-").replace("/", "-").lower()
    filename = f"{date.strftime('%Y-%m-%d')}-{title_slug}.md"
    filepath = os.path.join(POSTS_DIR, filename)

    if os.path.exists(filepath):
        continue  # Skip if post already exists

    content = markdowner.handle(entry.content[0].value)

    with open(filepath, "w") as f:
        f.write(f"---\n")
        f.write(f"title: \"{entry.title}\"\n")
        f.write(f"date: {date}\n")
        f.write(f"layout: post\n")
        f.write(f"---\n\n")
        f.write(f"[Read this post on Medium →]({entry.link})\n\n")
        f.write(f"This post originally appeared on [Medium]({entry.link}).\n")


    print(f"✅ Created: {filename}")
