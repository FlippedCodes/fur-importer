import { Login, Submissions, removeFromInbox } from 'furaffinity-api';

// get all submissions
export async function getPosts() {
  const out = await Submissions({ sort: 'old' });
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
