await Promise.all(
  Array.from({ length: 30 }).map(() =>
    fetch(`http://127.0.0.1:65243/api?x=${Math.random()}`, { cache: "no-store" }).then(r => r.json())
  )
).then(res => console.log(res.map(x => x.meta.podName)));
