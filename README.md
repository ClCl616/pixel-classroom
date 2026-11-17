# 생각회로 · PIXEL AI LAB

생활 속 인공지능 수업의 트롤리 딜레마 응답 사이트입니다. 픽셀 로봇 ‘회로’와 종이색 배경, 민트·살구·라일락 선택 색상으로 구성했습니다.

## 사용 흐름

1. 교사는 `?view=teacher`에서 로그인하고 수업을 만듭니다. 기본 예정 인원은 15명입니다.
2. PC에 표시된 QR 또는 참여 링크를 학생들에게 제공합니다. 학생은 이름·이메일 입력 없이 모바일로 접속합니다.
3. 교사가 **응답 시작하기**를 누릅니다.
4. 학생은 `선로를 바꾼다 / 바꾸지 않는다 / 판단을 유보한다` 중 하나를 고르고 이유를 한 문장(1~120자, 줄바꿈 없음)으로 작성합니다.
5. 교사는 3초 간격으로 갱신되는 제출 수를 확인합니다. 이때 다른 학생의 선택과 이유는 API에서도 공개되지 않습니다.
6. **응답 마감하기**로 서버에서 제출을 차단합니다. 이어 **집계와 이유 공개하기**로 막대 집계와 익명 이유 카드를 표시합니다. 학생 화면에서도 공개된 결과를 읽을 수 있습니다.
7. 필요하면 응답을 다시 열 수 있습니다. 기존 제출은 유지되며 아직 제출하지 않은 학생만 추가 제출합니다. 새 활동은 새 수업을 만드세요.

화면의 제출 칸은 학생 번호가 아니라 제출 건수를 나타냅니다. 선택과 이유는 자동으로 도덕적 정답 판정이나 AI 분류를 하지 않습니다.

## 현재 연결 상태

- Supabase 프로젝트: **pixel-classroom** / 서울
- 프로젝트 ID: `dwncrxeayznmmoyjdsit`
- 데이터베이스 테이블·RPC 함수 배포 완료. 로컬 `.env`에 공개 연결값 설정 완료.
- Anonymous Sign-Ins 활성화 확인. 사용자가 생성한 이메일 인증 완료 계정을 교사 허용 목록에 등록했습니다.
- GitHub 저장소: https://github.com/ClCl616/pixel-classroom
- 학생 접속 주소: https://clcl616.github.io/pixel-classroom/
- 교사 접속 주소: https://clcl616.github.io/pixel-classroom/?view=teacher
- GitHub Pages는 GitHub Actions로 배포하며, `main`에 push하면 검사·빌드 후 자동 재배포합니다. Repository variables에 공개 Supabase 연결값을 등록했습니다.
- 로컬 데이터베이스 테스트와 브라우저 연습 모드의 제출→마감→공개 흐름을 검증했습니다. 클라우드에서 실제 익명 로그인 및 학생의 교사 기능 접근 차단을 확인했고, DB 트랜잭션으로 교사 수업 생성→학생 제출→마감→공개를 검증한 뒤 테스트 수업·응답은 롤백했습니다. 배포된 화면에서 실제 휴대폰·PC 간 최종 검증은 배포 이후 필요합니다.

## 로컬 실행

Node.js 22 이상에서 실행합니다.

```sh
npm ci
npm run dev
```

학생: http://127.0.0.1:5173/

교사: http://127.0.0.1:5173/?view=teacher

로그인 없는 UI 연습: http://127.0.0.1:5173/?view=teacher&demo=1

연습 모드는 같은 브라우저의 localStorage만 사용합니다. 실제 학생 기기와 연결되지 않으며 상단에 연습 모드 표시가 나타납니다. 교사에서 수업 생성→시작→학생 화면 열기로 체험하세요. ‘예시 응답 6개 넣기’는 연습 모드에서만 표시됩니다.

## Supabase 인증 설정 (최초 1회)

1. https://supabase.com/dashboard/project/dwncrxeayznmmoyjdsit/auth/providers 에서 **Anonymous Sign-Ins**를 활성화합니다. 학생에게 회원가입을 요구하지 않으면서 서버가 제출자를 구분하기 위한 설정입니다.
2. Authentication → Users → Add user에서 수업 운영에 사용할 **교사 이메일과 비밀번호**로 사용자를 생성합니다. 비밀번호는 본인이 직접 설정합니다. 이 사이트에는 공개 회원가입 기능이 없습니다.
3. 생성된 교사 사용자의 UUID를 확인하고 SQL Editor에서 다음을 실행합니다.

```sql
insert into pixel_private.teachers (user_id)
values ('교사-사용자-UUID')
on conflict do nothing;
```

4. 교사 화면에서 로그인해 수업을 만들고, 다른 브라우저/휴대폰에서 학생으로 접속해 확인합니다.
5. 익명 로그인은 IP당 기본 요청 제한이 있습니다. 같은 교실 Wi-Fi로 여러 번 리허설할 경우 Authentication → Rate Limits를 확인하세요. 실제 수업 시작 전에 15명 접속을 점검합니다.

교사 로그인 세션과 학생 익명 세션은 별도 브라우저 저장 키를 사용하므로 같은 브라우저에서 학생 화면을 열어도 교사 로그인이 바뀌지 않습니다.

## GitHub Pages 배포

GitHub Pages는 정적 화면을 제공하고 Supabase가 기기 간 응답 저장과 권한 검사를 담당합니다. 서버 비밀키는 사용하지 않습니다.

1. GitHub에 새 저장소(예: `pixel-classroom`)를 만들고 **이 폴더의 내용**을 저장소 루트로 올립니다. 상위 `교직실무` 폴더 전체를 올리지 마세요. `.env`, `node_modules`, `dist`는 Git에서 제외됩니다.
2. 저장소 **Settings → Secrets and variables → Actions → Variables**에 다음 Repository variables를 추가합니다.

| 이름 | 값 |
| --- | --- |
| `VITE_SUPABASE_URL` | `https://dwncrxeayznmmoyjdsit.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_4lJ-uL-WH-b41tfmfsh9oA_k6R3Xav4` |

이 값은 브라우저에 배포되는 공개 연결값입니다. `service_role` 또는 secret key로 대체하면 안 됩니다.

3. **Settings → Pages → Source**를 **GitHub Actions**로 선택합니다.
4. `main` 브랜치에 push하거나 Actions의 **Deploy classroom to GitHub Pages → Run workflow**를 실행합니다.
5. 배포 후 `https://사용자명.github.io/pixel-classroom/`을 학생 기본 주소로 사용합니다. 교사는 같은 주소 뒤에 `?view=teacher`를 붙입니다. 참여 링크와 QR은 실제 배포 주소를 자동으로 사용합니다.

`.github/workflows/pages.yml`에 설치·검사·빌드·배포가 준비되어 있습니다. Vite 상대 경로 빌드로 저장소 하위 경로를 지원합니다.

## 검증 및 데이터 설계

```sh
npm test
npm run build
```

- PostgreSQL 호환 PGlite에서 실제 스키마와 RPC로 권한·마감·중복·결과 비공개·상태 전환을 검사합니다.
- 데이터는 `pixel_private` 비공개 스키마에 저장하고 모든 테이블에 RLS를 활성화했습니다. 테이블 직접 접근은 허용하지 않습니다.
- 공개 RPC는 SECURITY INVOKER이고 비공개 처리 함수는 제한된 SECURITY DEFINER입니다. 인증 사용자 확인, 교사 허용 목록, 수업 소유권, 상태 검사를 수행합니다. 검색 경로는 비어 있으며 모든 DB 객체에 스키마를 명시합니다.
- 테이블에 RLS 정책을 두지 않은 것은 직접 테이블 접근을 전부 막기 위한 의도적인 구성입니다. Supabase advisor의 `rls_enabled_no_policy` INFO 3건은 이 세 비공개 테이블에 해당합니다. 참고: https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy
- 수업별 사용자당 한 번 제출을 DB 기본키로 강제합니다. 제출과 마감은 같은 수업 행 잠금을 사용하므로 서버 처리 순서상 마감된 뒤 제출이 끼어들 수 없습니다.
- 로그인 없이 참여하는 구조라, 브라우저 데이터를 지우거나 다른 브라우저·기기를 사용하면 새로운 참여자로 인식합니다. 학생 개인 신원 인증 시스템은 아닙니다.
- 이유는 한 줄과 길이를 검사하며 실제로 문장이 하나인지 언어학적으로 판정하지는 않습니다.
- 자유 입력 문장은 HTML 이스케이프하여 표시합니다.
- 처음 보는 새 Supabase 프로젝트에만 `database/setup.sql`을 실행하세요. 현재 연결 프로젝트에는 이미 적용되어 있으므로 재실행할 필요가 없습니다.

## 공식 참고 자료

- GitHub Pages: https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages
- Supabase 익명 로그인: https://supabase.com/docs/guides/auth/auth-anonymous
- Supabase RLS: https://supabase.com/docs/guides/database/postgres/row-level-security

## 사이버폭력 예방 활동 (추가)

- 학생: 기본 화면의 **02 · 사이버폭력 예방** 또는 `cyber/`로 접속합니다.
- 교사: 교사 입장/수업 목록의 활동 메뉴 또는 `?view=teacher&activity=cyber`에서 QR과 참여 링크를 안내합니다.
- 기존 트롤리 활동의 로그인, 수업 코드, 제출, 마감, 집계 공개 기능은 유지합니다.
- 사이버 활동은 가상 단톡방의 사진 조롱·유포를 다루는 3단계 선택 체험입니다. 단계별 반응과 해설, 개인 결과, 실천 문장 입력을 제공합니다.
- 개인 선택·결과·문장은 서버, localStorage, sessionStorage에 보내거나 저장하지 않습니다. 현재 페이지 메모리에만 존재하며 페이지를 떠나면 초기화합니다. 교사에게도 결과나 완료 인원을 제공하지 않습니다.
- 공개된 시나리오와 해설 자체는 누구나 읽을 수 있지만 다른 학생의 실제 선택 기록을 조회하는 API는 없습니다.
- 교사용 사이버 활동 안내는 로그인 없이 볼 수 있습니다. 학생 데이터 조회나 수업 관리 권한을 부여하는 페이지가 아닙니다.
- 같은 기기의 화면을 다른 사람이 직접 보면 결과를 볼 수 있으므로 공용 기기에서는 체험 후 페이지를 닫습니다.
- `public/cyber`는 자체 실행 가능한 정적 활동이고, 기본 앱에서 동일 사이트 경로로 연결합니다. 별도 Sites 사이트로 이동하지 않습니다.

### 몰입형 체험

채팅이 순서대로 나타나고 입력 중 표시, 선택지 등장, 응답 전환을 애니메이션으로 표현합니다. 체험 중에는 사이트 머리말·꼬리말과 교육 해설을 숨기고, 결과 화면에서 해설을 제공합니다. 대화 바로 보기를 지원하며 OS의 동작 감소 설정을 자동 반영합니다. 화면의 움직임 토글·나가기 버튼은 제거했습니다. 페이지 종료·재시작 시 대기 타이머를 취소합니다.

### 한 화면 진행

채팅은 말풍선이 순서대로 누적되며 새 메시지가 들어오면 자동으로 위로 이동합니다. 채팅 이전/다음 버튼과 반복 안내 문구는 제거했습니다. 선택지는 A·B·C와 굵은 테두리, 눌림 효과로 구분합니다. 결과는 세 가지 선택 해설과 실천 문장을 총 네 화면으로 나누었습니다. 360×640 및 320×568 세로 화면에서 선택지와 결과를 확인했습니다. 높이 440px 이하의 가로 화면은 내용 잘림을 방지하기 위해 스크롤을 허용합니다.


### 연속 대화와 이미지

같은 채팅방의 메시지는 누적됩니다. 단톡방에서 민서 개인 채팅으로 바뀌는 시점에는 상단 이름·시간을 갱신하고 이전 방의 대화를 비운 뒤 새 메시지를 표시합니다. 중간 ‘다음 대화’ 버튼과 단계 숫자, 시작 화면의 가상 체험 문구를 제거했습니다. 마지막 결과만 별도로 확인합니다.

이미지: `public/cyber/minseo-classroom.png`. 기본 내장 image_gen으로 생성. 프롬프트: “Create a single square pixel art illustration for an image attachment inside a Korean middle school classroom chat simulator. A fictional middle school student Minseo with short dark hair, cream shirt and muted mint school vest, at a classroom desk, turning to wave at a friend, eyes caught mid-blink and a naturally surprised innocent expression. Warm classroom afternoon, simple desk and green chalkboard background. Authentic crisp chunky 16-bit pixel art with a restrained sage green, cream, peach and dark forest palette matching a pixel classroom app. The student is portrayed respectfully, no ridicule or distorted face. Medium shot, clear readable silhouette, subject centered. No letters, captions, UI, logos or watermarks. Not a real person or photograph.”


### 휴대폰 화면 업데이트

시간, 신호, Wi-Fi, 배터리는 시나리오용 장식이며 실제 기기 상태를 수집하지 않습니다. 선택지의 화살표는 제거했습니다.

현재 첨부 이미지: `public/cyber/minseo-silly.png`. 내장 image_gen 편집 모드로 제작. 최종 프롬프트: “Edit the supplied pixel-art classroom illustration for a fictional middle-school chat story. Preserve the same character, outfit, classroom, waving pose, composition and warm sage/cream pixel-art aesthetic. Change only the facial expression to an intentionally silly playful funny face caught by a friend: both eyes squeezed into exaggerated uneven squints, puffed cheeks, eyebrows at different heights, and a comically puckered crooked mouth. Expressive and goofy like a deliberately silly selfie, not frightening or dehumanizing. Keep it respectful, no injury, no sexual content. Crisp visible pixel-art edges, no text or captions.”

### 알림 탭과 대화 기록 탐색

민서 새 메시지 알림은 누를 때까지 유지되며, 알림을 탭하거나 키보드로 활성화해야 개인 채팅방에 들어갑니다. 건너뛰기·동작 감소 설정도 이 대기 단계를 건너뛰지 않습니다. 행동 선택지와 해당 선택 기록은 소괄호로 표시합니다. 채팅 영역만 스크롤되며, 이전 대화를 읽는 중에는 새 메시지가 도착해도 강제로 맨 아래로 이동하지 않습니다.

### 행동의 시각적 표현

대사만 내 말풍선으로 표시합니다. 웃는 반응은 사진 아래 😂 배지, 지켜보기는 별도 표시 없이 대기, 기록 보관·도움 요청은 처리 상태 카드, 사진 전달은 썸네일과 수신 인원, 차단은 차단 상태와 꺼진 토글로 표시합니다. 모든 처리는 시뮬레이터 내부 표현이며 실제 메시지 발송·파일 보관·차단 API를 호출하지 않습니다. 알림은 누르기 전까지 테두리 파동과 미세한 눌림 애니메이션을 반복하며, OS 동작 감소 설정에서는 정적 테두리로 표시합니다.

### 휴대폰 기능 조작 흐름

기록 보관은 캡처 → 미리보기 → 저장 → 교사에게 메시지 전송, 사진 전달은 수신자 선택 → 사진 미리보기 → 전송, 차단은 프로필 → 차단 확인 → 적용 화면으로 진행합니다. 각 화면 진입·캡처·완료에 애니메이션을 적용했습니다. 조작 완료 전에는 행동 보고 메시지를 보내지 않으며, 완료 후 민서에게 자연스러운 대사로 알립니다. 선택지에는 인용부호를 유지하고 실제 말풍선에서는 바깥 쌍따옴표를 제거합니다. 모든 동작은 시뮬레이터 내에서만 진행됩니다.

### 대화 일관성과 취소

- 도움 요청 후 민서의 답변은 이미 전달된 걱정을 인정하고 동행을 부탁하는 내용으로 수정했습니다. 차단 후에는 민서의 화면까지 바뀐 것처럼 표현하지 않습니다.
- 사진 전달·차단은 각 조작 단계에서 취소하거나 Escape로 돌아올 수 있습니다. 취소 시 대화나 실행 결과를 추가하지 않고 현재 선택을 해제합니다.
- 캡처와 저장 미리보기는 해당 체험의 실제 단톡방 기록을 사용합니다. 직접 보낸 대사, 분기별 답장, 사진 반응이 반영되며 이 기록도 페이지 메모리에서만 유지됩니다.
- 전달 대상의 이름을 전송 미리보기와 완료 후 대사에 반영합니다. 한 명만 선택한 경우에도 맞도록 선택지 표현도 ‘친구에게 전달’로 통일했습니다.

캡처와 저장 미리보기는 대화 전체를 화면 크기에 맞춰 한 장으로 표시하며 내부 스크롤을 사용하지 않습니다. 기능 아이콘은 SVG로 표시합니다.

결과는 각 선택별로 한 화면에 표시합니다. 선택한 행동, 행동의 영향, 다음 대응을 구분하고 상단 안내와 페이지 수는 생략합니다. 마지막 문장 연습 화면의 종료 버튼은 개인 결과와 작성 내용을 지우고 시작 화면으로 돌아갑니다.

## 홈에서 바로 참여하는 활동

- 홈의 두 활동은 모두 **활동 참여하기** 버튼으로 시작합니다.
- 트롤리 딜레마는 `?activity=trolley`에서 수업 생성·로그인·참여 코드 없이 진행합니다. 선택과 이유 작성 → 내 생각 돌아보기 → 수정 또는 종료 흐름입니다.
- 이 개인 활동의 응답은 현재 페이지 메모리에서만 처리하며 서버에 제출하거나 반 전체 집계에 포함하지 않습니다. 기존 교사 수업 링크를 통한 공동 활동은 별도로 유지됩니다.
- 홈과 트롤리의 상단 헤더는 스크롤 중에도 보입니다. 사이버 활동의 소개 화면 헤더도 고정되며, 채팅 체험은 기존 몰입형 화면을 사용합니다.

### 몰입형 트롤리 체험

- 홈에서 참여하면 사이트 헤더 없이 창 높이를 사용하는 픽셀 애니메이션 체험이 시작됩니다.
- 도입 → 선로 선택 → 선택에 따른 기차 이동 → 이유 작성 → 돌아보기 순서로 화면을 전환합니다. 충돌이나 상해 장면은 표시하지 않습니다.
- 선로 변경·유지·판단 유보에 서로 다른 장면과 질문을 제공합니다. 동작 감소 설정에서는 정적인 최종 위치로 표시합니다.
- 홈과 개인 활동은 기본적으로 페이지 스크롤 없이 진행합니다. 사이버 활동의 이전 대화는 채팅 영역 안에서만 스크롤할 수 있습니다.
- 320×568 화면에서 홈, 트롤리 선택·작성·결과와 사이버 채팅 선택지 배치를 확인했습니다.
