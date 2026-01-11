#!/bin/sh

URL="http://127.0.0.1:61408/api"
COUNT=50
CONCURRENCY=10

echo "Sending $COUNT requests with concurrency=$CONCURRENCY ..."

seq "$COUNT" \
| xargs -n1 -P "$CONCURRENCY" sh -c '
  curl -s "$0" \
  | grep -o "\"podName\"[[:space:]]*:[[:space:]]*\"[^\"]*\"" \
  | cut -d":" -f2 \
  | tr -d " \""
' "$URL" \
| sort \
| uniq -c \
| awk "{ printf \"%s: %s\n\", \$2, \$1 }"
