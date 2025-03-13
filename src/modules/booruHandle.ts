import axios from 'axios';

import config from '../config.json' assert { type: 'json' };

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

async function getStory(url) {
  const output = await axios.get(url);
  return output;
}

async function upload(contentUrl: string) {
  const output = await api.post('uploads/', { contentUrl });
  return output.data.token;
}

async function validate(contentToken: string) {
  const output = await api.post('posts/reverse-search/', { contentToken });
  return output.data.exactPost;
}

export async function createPost(submission, safety: maturity, storyUrl?) {
  // upload file
  const contentToken = await upload(submission.downloadUrl);
  const samePost = await validate(contentToken);
  if (samePost && !storyUrl) return null;
  let postOut = samePost;
  if (!samePost) {
    // bundle tags and make lowercase
    submission.keywords.push(submission.author.id);
    // upload post
    const postOutRaw = await api.post('posts/', {
      tags: submission.keywords, safety, contentToken, source: submission.url.replace('http:', 'https:'),
    });
    postOut = postOutRaw.data;
  }
  let desc = submission.description;
  if (storyUrl) {
    const extention = storyUrl.substr(submission.downloadUrl.length - 4);
    const story = extention === '.txt' ? await getStory(storyUrl) : storyUrl;
    desc = `
      ${submission.description}
  
      Story
      ==========================
      ${story}`;
  }
  // update desc
  if (desc) await api.post('comments/', { text: desc, postId: postOut.id });
  return postOut;
}

export { createPost as default };
