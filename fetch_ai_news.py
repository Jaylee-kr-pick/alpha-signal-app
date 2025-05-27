import feedparser
import csv
from datetime import datetime

rss_url = 'https://finance.naver.com/news/news_list.naver?mode=RSS&section_id=101&section_type=industry'
feed = feedparser.parse(rss_url)

with open('public/data/ai_news.csv', 'w', newline='', encoding='utf-8') as csvfile:
    writer = csv.writer(csvfile)
    writer.writerow(['title', 'link', 'published'])  # 헤더

    for entry in feed.entries:
        title = entry.title
        link = entry.link
        published = entry.published if 'published' in entry else datetime.now().isoformat()
        writer.writerow([title, link, published])