import config from './config.json';

import {
  getPosts, setup as FAsetup, cleanupCache, checkCache,
} from './modules/faHandle';

import { createPost } from './modules/booruHandle';

async function checkBlacklist(title: string) {
  const output = config.fa.blacklist.map((blackword) => title.toLowerCase().includes(blackword.toLowerCase()));
  return output.every((v) => v === false);
}

type maturity = 'safe' | 'sketchy' | 'unsafe';

function getSafety(type: number): maturity {
  switch (type) {
    case 1: return 'safe';
    case 2: return 'sketchy';
    case 4: return 'unsafe';
    default: return 'unsafe';
  }
}

async function loop() {
  setInterval(async () => {
    // get latest posts
    const posts = await getPosts();
    // run through all of them
    await posts.forEach((post, i) => {
      setTimeout(async () => {
        const id = parseInt(post.id, 10);
        // check cache
        if (await checkCache(id)) return;
        // get submittion details
        const submission = await post.getSubmission();
        // check blalisted words in title
        if (!await checkBlacklist(submission.title)) return;
        // add additional tags
        const append = submission.title.split(' ');
        submission.keywords.push(...append);
        submission.keywords.push(new Date().getFullYear().toString());
        // add to collection
        await createPost(submission.downloadUrl, submission.keywords, submission.author.id, getSafety(submission.rating), submission.url);
        // wait a secound between requests
      }, 10000 * i);
    });
    cleanupCache();
  // await whatever interval
  }, config.fa.interval * 60000);
}

async function main() {
  // setup session to parse posts
  await FAsetup();
  // startup mainloop to start parsing
  loop();
}

main();

// logging error; supress crash
process.on('uncaughtException', (err) => {
  console.error('ERROR:', err);
});
