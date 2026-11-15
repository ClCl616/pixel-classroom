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
- **남은 설정:** Anonymous Sign-Ins 활성화, 교사 계정 생성 및 허용 목록 등록.
- GitHub 저장소 및 GitHub Pages 공개 배포는 아직 생성/실행하지 않았습니다.
- 로컬 데이터베이스 테스트와 브라우저 연습 모드의 제출→마감→공개 흐름을 검증했습니다. 실제 휴대폰·PC 간 클라우드 통합 검증은 위 인증 설정 이후 필요합니다.

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
