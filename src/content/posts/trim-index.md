---
title: Trim 지수
description: 반복되는 trim 호출과 정규화 책임, DTO와 VO의 역할
pubDate: 2026-08-01
tags:
  - OOP
  - DTO
  - VO
---

여러분은 Trim 지수에 대해서 들어보셨나요? 아마 들어보신 적이 없을 겁니다. 제가 임의로 만든 이름이기 때문입니다.

저는 스타트업과 소규모 팀에서 Nest.js와 TypeScript를 사용해 개발하고 있습니다. 스타트업에서는 빠른 구현과 출시 일정이 중요하다 보니, 개발 과정에서 구조적으로 아쉬움을 느끼는 순간이 종종 있습니다.

이 글의 코드 예시는 Nest.js의 `class-validator`, `class-transformer`를 사용한다는 전제로 작성했습니다.

## Trim 지수

이 글에서 말하는 Trim 지수는 코드베이스에서 `trim()`과 같은 문자열 정규화 로직이 얼마나 자주, 어떤 계층에서 반복되는지를 살펴보기 위해 만든 개념입니다. 측정 방법은 단순합니다. 에디터에서 `trim`을 검색하는 것입니다.

물론 Trim 지수는 엄밀한 정적 분석 지표도 아니고, 절대적인 코드 품질 지표도 아닙니다. `trim()` 호출이 많다고 해서 반드시 잘못된 설계라는 의미는 아닙니다. CSV 파싱, 외부 데이터 처리, 로그 분석처럼 명시적인 문자열 정제가 필요한 경우도 많습니다.

하지만 같은 도메인 값에 대한 정규화가 여러 서비스와 쿼리에 반복된다면, 규칙이 코드베이스 곳곳에 흩어져 있다는 신호일 수 있습니다.

현재 제가 살펴본 코드베이스에서 `trim` 검색 결과는 약 680건이었고, 그중 한 서비스 파일에서만 186건이 검색됐습니다. 물론 680건 모두가 문제가 있는 코드는 아니었습니다. 그중에서도 같은 필드에 대해 서비스와 데이터베이스 쿼리에서 반복적으로 공백을 제거하는 사례가 눈에 띄었습니다.

코드는 대체로 다음과 같은 형태였습니다.

```ts
function someMethod(variable: string) {
  const safeVariable = variable.trim().toLowerCase();
  // ...
}
```

같은 항목을 다루는 여러 서비스 로직에서 `trim()`을 호출하고, 데이터베이스 조회 쿼리에서도 `BTRIM`을 사용하고 있었습니다.

왜 이런 일이 발생했을까요?

제 생각에는 값이 가진 규칙을 별도의 타입으로 표현하지 않고, 원시 타입 그대로 다루기 때문입니다.

## 원시 타입은 값의 의미를 표현하지 못한다

회원 정보에는 이메일, 연락처, 나이처럼 서로 다른 의미를 가진 값이 저장됩니다. 이를 원시 타입으로만 표현하면 다음과 같습니다.

```ts
email: string;
mobile: string;
age: number;
```

하지만 `string`과 `number`는 도메인의 의미를 표현하기에는 너무 넓은 타입입니다. 이메일과 연락처에는 각자 정해진 형식이 있고, 사용자의 나이는 음수가 될 수 없습니다. 하지만 원시 타입만으로는 이러한 규칙을 보장할 수 없습니다.

클라이언트 요청이나 데이터베이스 저장 단계에서는 문자열과 숫자처럼 직렬화 가능한 값으로 표현되지만, 서비스 로직 안에서도 반드시 원시 타입 그대로 다룰 필요는 없습니다.

입력값의 정규화와 검증을 담당하는 별도의 책임을 둘 수 있습니다. 특히 같은 값이 여러 서비스와 여러 입력 경로에서 사용된다면 그 필요성은 더욱 커집니다.

사용자의 이메일 수정 기능을 원시 타입으로 작성하면 다음과 같은 형태가 될 수 있습니다.

```ts
async function updateUserEmail(userId: number, email: string) {
  const user = await this.userRepository.findOneById(userId);

  user.email = email.trim();

  await this.userRepository.save(user);
}
```

`email`이 단순한 `string`이기 때문에 서비스 로직에 `trim()`과 같은 정규화 로직이 들어갑니다. 여기에 이메일 형식 검증까지 필요하다면 서비스의 책임은 점점 늘어납니다.

```ts
async function updateUserEmail(userId: number, email: string) {
  const normalizedEmail = email.trim();

  if (!isEmail(normalizedEmail)) {
    throw new Error("올바른 이메일 형식이 아닙니다.");
  }

  const user = await this.userRepository.findOneById(userId);

  user.email = normalizedEmail;

  await this.userRepository.save(user);
}
```

문제는 이메일을 수정하는 경로가 이 메서드 하나뿐이라는 보장이 없다는 것입니다. 일반 사용자 API에서는 정규화를 수행했지만 관리자 API, 배치 작업, 데이터 이관 로직에서는 누락될 수 있습니다.

이처럼 일부 경로에서 검증이나 정규화가 빠지면 계층마다 서로 다른 형태의 값이 사용되거나, 잘못된 데이터가 저장될 가능성이 생깁니다. 데이터베이스에 앞뒤 공백이 포함된 값이 쌓이기 시작하면 조회 쿼리에서도 `BTRIM`을 사용해 데이터를 보정하게 됩니다.

이러한 코드가 하나둘 쌓이면 개발자는 버그를 피하기 위해 더 많은 곳에서 `trim()`을 호출하게 됩니다.

문제는 `trim()` 자체가 아닙니다.

값이 생성되는 모든 경로에서 동일한 규칙을 보장할 위치가 없다는 것이 문제입니다.

## DTO와 VO로 책임 옮기기

DTO와 VO를 사용해 잘못된 값이 서비스 로직에 전달되지 않도록 만들면 어떻게 될까요?

이 글에서는 DTO를 외부 입력을 받는 경계로, VO를 도메인 규칙이 보장된 값으로 구분합니다. 아래 코드는 설명을 위해 단순화한 예시입니다.

```ts
import { Transform } from "class-transformer";
import { IsInstance } from "class-validator";
import { EmailVO } from "./email.vo";

export class UpdateUserEmailRequest {
  @Transform(({ value }) => EmailVO.of(value), {
    toClassOnly: true,
  })
  @IsInstance(EmailVO)
  email!: EmailVO;
}
```

```ts
export class EmailVO {
  private constructor(private readonly value: string) {}

  static of(value: unknown): EmailVO {
    if (typeof value !== "string") {
      throw new Error("이메일은 문자열이어야 합니다.");
    }

    const normalizedEmail = value.trim();

    if (!isEmail(normalizedEmail)) {
      throw new Error("올바른 이메일 형식이 아닙니다.");
    }

    return new EmailVO(normalizedEmail);
  }

  getValue(): string {
    return this.value;
  }
}
```

서비스에서는 이미 정규화와 검증이 완료된 값을 전달받습니다.

```ts
async function updateUserEmail(userId: number, request: UpdateUserEmailRequest) {
  const user = await this.userRepository.findOneById(userId);

  user.email = request.email.getValue();

  await this.userRepository.save(user);
}
```

이렇게 작성하면 서비스 레이어에서 `email.trim()`을 반복해서 호출하지 않아도 됩니다. 이메일 값이 생성되는 시점에 정규화와 검증이 끝났기 때문입니다.

VO를 사용하면 서비스 로직은 값의 형태를 매번 다시 의심하지 않아도 됩니다. 이메일 형식이 올바른지, 앞뒤 공백이 제거되었는지에 대한 판단은 `EmailVO`가 생성되는 시점에 끝납니다.

나중에 이메일 규칙이 바뀌더라도 수정 범위를 좁힐 수 있습니다. 예를 들어 특정 도메인의 이메일만 허용해야 하거나 허용하지 않을 이메일 패턴이 생긴다면, 여러 서비스에 흩어진 검증 코드를 찾아다니는 대신 `EmailVO`의 생성 규칙을 수정하면 됩니다.

서비스는 다음과 같은 유스케이스에 더 집중할 수 있습니다.

> 검증된 이메일을 사용해 회원 정보를 수정한다.

## 모든 값에 VO가 필요한 것은 아니다

반복되는 정규화 문제를 해결하는 방법이 VO만 있는 것도 아닙니다. 공통 파이프, 커스텀 데코레이터, 매퍼, ORM Transformer와 같은 방법을 사용할 수도 있습니다.

단순한 검색어처럼 원시 타입으로 표현해도 충분한 값이 있고, 별도의 도메인 규칙이 없는 값까지 모두 VO로 만들면 오히려 코드가 복잡해질 수 있습니다.

다만 다음과 같은 조건이라면 VO 도입을 검토할 수 있습니다.

- 같은 값의 검증이나 정규화가 여러 서비스에서 반복된다.
- 값이 생성되는 입력 경로가 여러 개다.
- 값이 특정 형식이나 불변 조건을 가져야 한다.
- 원시 타입만으로는 값의 의미를 구분하기 어렵다.

`trim()` 하나가 보인다고 VO가 필요한 것은 아닙니다. 하지만 같은 도메인 값을 다루는 여러 경로에서 정규화와 검증이 반복된다면, 그 책임을 값 자체로 옮길 수 있는지 살펴볼 만합니다.

Trim 지수는 코드의 품질 점수가 아닙니다. 코드베이스 곳곳에 흩어진 값의 규칙을 발견하기 위한 하나의 출발점입니다.
