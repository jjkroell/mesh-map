import { sampleKey, posFromHash } from '../content/shared.js'

async function migrateSamples(context) {
  const store = context.env.SAMPLES;
  const toFix = []
  let cursor = null;

  do {
    const samplesList = await store.list({cursor: cursor});
    cursor = samplesList.cursor ?? null;

    // // Migration from old key to geohash
    // await Promise.all(samplesList.keys.map(async s => {
    //   const parts = s.name.split('|');
    //   if (parts.length === 2) {
    //     const metadata = s.metadata;
    //     const key = sampleKey(metadata.lat, metadata.lon);
    //     await store.put(key, "", {
    //       metadata: metadata,
    //     });
    //     await store.delete(s.name);
    //   }
    // }));

    // Fix up missing paths.
    samplesList.keys.forEach(s => {
      if (s.metadata.path.includes('')) {
        const [lat, lon] = posFromHash(s.name);
        let path = s.metadata.path;
        path = path.filter(x => x != '');
        path.push(lat > 47.7 ? '86' : '7e');
        const fixed = {key: s.name, metadata: { time: s.metadata.time, path: path }};
        toFix.push(fixed);
        console.log(fixed);
      }
    });
  } while (cursor !== null)

  await Promise.all(toFix.map(async s => {
    await store.put(s.key, "", {
      metadata: s.metadata,
    });
  }));
}

async function migrateRepeaters(context) {
  // const store = context.env.REPEATERS;
  // const repeatersList = await store.list();

  // // Fix up key consistency
  // await Promise.all(repeatersList.keys.map(async r => {
  //   const metadata = r.metadata;
  //   const key = `${metadata.id}|${metadata.lat.toFixed(4)}|${metadata.lon.toFixed(4)}`;
  //   if (key !== r.name) {
  //     await store.put(key, "", {
  //       metadata: metadata
  //     });
  //     await store.delete(r.name);
  //   }
  // }));
}

export async function onRequest(context) {
  await migrateSamples(context);
  await migrateRepeaters(context);

  return new Response('OK');
}
