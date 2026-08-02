export const site = {
  title: "othdev's blog",
  description: '개발, 배움, 일상의 기록을 차분하게 쌓아두는 개인 블로그입니다.',
  author: '오태현',
  url: 'https://ohtaehyun.github.io'
};

export type BlogPost = {
  frontmatter: {
    title: string;
    description: string;
    pubDate: string;
    updatedDate?: string;
    tags?: string[];
    draft?: boolean;
  };
};

export type BlogPostListItem = BlogPost & {
  url: string;
};

export function formatDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(new Date(value));
}

export function sortPosts<T extends BlogPost>(posts: T[]) {
  return posts
    .filter((post) => !post.frontmatter.draft)
    .sort(
      (a, b) =>
        new Date(b.frontmatter.pubDate).getTime() -
        new Date(a.frontmatter.pubDate).getTime()
    );
}
