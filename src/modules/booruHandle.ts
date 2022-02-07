import axios from 'axios';

import config from '../config.json';

type maturity = 'safe' | 'sketchy' | 'unsafe';

const rawToken = `${process.env.szuruUser}:${process.env.szuruToken}`;

const token = Buffer.from(rawToken).toString('base64');

const api = axios.create({
  baseURL: config.szuru.endpoint,
  headers: {
    authorization: `Token ${token}`,
    Accept: 'application/json',
    'Content-Type': 'application/json',
    Host: config.szuru.host,
  },
  validateStatus(status) {
    return status >= 200 && status < 500;
  },
});

async function updateTag(tagName: string) {
  // get tag version
  const output = await api.get(`tag/${tagName}`);
  // update tag
  await api.put(`tag/${tagName}`, { version: output.data.version, category: 'artist' });
}

async function upload(contentUrl: string) {
  const output = await api.post('uploads/', { contentUrl });
  return output.data.token;
}

async function validate(contentToken: string) {
  const output = await api.post('posts/reverse-search/', { contentToken });
  return output.data.exactPost;
}

export async function createPost(submission, safety: maturity) {
  // upload file
  const contentToken = await upload(submission.downloadUrl);
  if (await validate(contentToken)) return null;
  // bundle tags and make lowercase
  submission.keywords.push(submission.author.id);
  // upload post
  const postOut = await api.post('posts/', {
    tags: submission.keywords, safety, contentToken, source: submission.url,
  });
  // update special tags
  await updateTag(submission.author.id);
  // update desc
  if (submission.description) await api.post('comments/', { text: submission.description, postId: postOut.data.id });
  return postOut.data;
}

export { createPost as default };
