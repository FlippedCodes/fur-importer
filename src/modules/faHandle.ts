import { Login, Submissions, removeFromInbox } from 'furaffinity-api';

import config from '../config.json';

// get all submissions
export async function getPosts() {
  const out = await Submissions();
  return out;
}

export async function deletePosts(ids) {
  await removeFromInbox(ids);
}

// STARTUP
export async function setup() {
  // provide cookie data
  await Login(process.env.FACookieA, process.env.FACookieB);
}
