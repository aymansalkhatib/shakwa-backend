#!/bin/sh

URL="http://127.0.0.1:8080/api"
COUNT=200

echo "Sending $COUNT requests..."

i=1
while [ $i -le $COUNT ]; do
  curl -s "$URL" \
    | grep -o '"podName"[[:space:]]*:[[:space:]]*"[^"]*"' \
    | cut -d':' -f2 \
    | tr -d ' "'
  i=$((i + 1))
done \
| sort \
| uniq -c \
| awk '{ printf "%s: %s\n", $2, $1 }'
