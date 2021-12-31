import * as config from './config.json';

import {
  getPosts, setup as FAsetup, postHandle, cleanupCache,
} from './modules/fahandle';

async function loop() {
  setInterval(async () => {
    const posts = await getPosts();
    await posts.forEach((post) => postHandle(post));
    cleanupCache();
  // await 20 mins
  }, 10000);
  // }, Config.fa.interval * 60000);
}

async function main() {
  // setup session to parse posts
  await FAsetup();
  loop();
}

main();

// logging error; supress crash
process.on('uncaughtException', (err) => {
  console.error('ERROR:', err);
});
