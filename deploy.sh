#!/bin/bash
set -e

if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
  echo "Error: CLOUDFLARE_API_TOKEN not set"
  exit 1
fi

hugo --minify --baseURL "https://www.greenbladesec.com/"
wrangler pages deploy public --project-name greenbladesec-website --commit-dirty=true

echo "Deployed to https://www.greenbladesec.com"
