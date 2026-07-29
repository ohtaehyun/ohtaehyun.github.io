---
title: 첫 번째 기록
description: 블로그를 시작하며 어떤 글을 남길지 적어둔 짧은 메모입니다.
pubDate: 2026-07-28
tags:
  - Note
  - Mermaid
---

블로그의 첫 목표는 완성도가 높은 글만 모아두는 것이 아니라, 다시 찾을 수 있는 기록을 꾸준히 남기는 것입니다.

작게 배운 것, 해결한 문제, 나중에 반복하고 싶지 않은 실수를 짧게라도 적어두면 시간이 지나도 쓸모가 있습니다.

## Mermaid 예시

아래처럼 `mermaid` 코드블록을 쓰면 글 페이지에서 다이어그램으로 렌더링됩니다.

```mermaid
flowchart TD
  A[Markdown 글 작성] --> B[Astro 빌드]
  B --> C[정적 HTML 생성]
  C --> D[GitHub Pages 배포]
```
