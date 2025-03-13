import PQueue from 'p-queue';

import { getPosts, setup as FAsetup, deletePosts } from './modules/faHandle.js';

import { createPost } from './modules/booruHandle.js';

import config from './config.json' assert { type: 'json' };

const mainQ = new PQueue({ concurrency: 1 });

const postQ = new PQueue({ concurrency: 3 });

let del = [];

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

async function addSubmission(post) {
  // get submittion details
  const submission = await post.getSubmission();
  // check blacklisted words in title
  if (!await checkBlacklist(submission.title)) return 'blacklist';
  // add additional tags
  const append = submission.title.split(' ');
  submission.keywords.push(...append);
  submission.keywords.push(new Date().getFullYear().toString());
  // check if content is a story
  if (submission.content.category === 13) {
    const storyUrl = submission.downloadUrl;
    submission.downloadUrl = submission.previewUrl;
    const out = await createPost(submission, getSafety(submission.rating), storyUrl);
    return out;
  }
  if (submission.content.category === 16) return 'audio';
  // add to collection
  const out = await createPost(submission, getSafety(submission.rating));
  return out;
}

async function loopPosts(posts) {
  await posts.forEach((post) => {
    postQ.add(async () => {
      const out = await addSubmission(post);
      switch (out) {
        case 'audio':
          console.warn(`Post ${post.id} is a audio! Removing.`);
          del.push(post.id);
          return;
        case 'blacklist':
          console.warn(`Post ${post.id} is blacklisted! Removing.`);
          del.push(post.id);
          return;
        case null:
          console.warn(`Post ${post.id} is already present! Removing.`);
          del.push(post.id);
          return;
        default:
          if (out.name === 'InvalidPostContentError') return console.warn(`Post ${post.id} is not a picture! Skipping.`);
          console.log(`Post ${post.id} has been added!`);
          del.push(post.id);
          return;
      }
    });
  });
}

async function start() {
  // TEMP: debug intermediate
  await mainQ.add(async () => {
    console.log('New page!');
    // get latest posts
    const posts = await getPosts();
    if (posts.length === 0) return;
    await loopPosts(posts);
  });

  setInterval(async () => {
    await mainQ.add(async () => {
      console.log('New page!');
      // get latest posts
      const posts = await getPosts();
      if (posts.length === 0) return;
      await loopPosts(posts);
    });
    // convert minutes into MS
  }, config.fa.interval * 60000);
}

async function cleanupDonePosts() {
  setInterval(async () => {
    if (del.length === 0) return;
    await deletePosts(del);
    console.log('Cleaned submissions');
    del = [];
    // convert minutes into MS
  }, config.fa.cleanupInterval * 60000);
}

async function main() {
  // setup session to parse posts
  await FAsetup();
  start();
  cleanupDonePosts();
}

main();

// logging error; suppress crash
process.on('uncaughtException', (err) => {
  console.error('ERROR:', err);
});
