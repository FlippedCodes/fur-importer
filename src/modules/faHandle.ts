import { Login, Submissions } from 'furaffinity-api';

import config from '../config.json';

// create cache array
const cache: number[] = [];

// check cache and and push if not there
export async function checkCache(id: number) {
  if (!cache.includes(id)) {
    cache.push(id);
    return false;
  }
  return true;
}

// get all submissions
export async function getPosts() {
  let out;
  await Submissions().then((res) => out = res);
  return out;
}

// STARTUP
export async function setup() {
  // provide cookie data
  await Login(process.env.FACookieA, process.env.FACookieB);
  // get all subissions on latest page
  const initList = await getPosts();
  // cache all known posts
  initList.map((post) => cache.push(parseInt(post.id, 10)));
}

// garbadge colletion: removed old posts to prevent memory leak
export async function cleanupCache() {
  // sort decending
  cache.sort((a, b) => b - a);
  cache.slice(0, config.fa.maxCache);
}
