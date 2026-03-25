# Consumer-Driven Contract Testing with Pact

Ensure backend changes never silently break the frontend or other API consumers. Pact lets each consumer define the interactions it depends on, and the backend verifies it can honour them.

---

## How It Works

```
Consumer (Frontend)          Provider (Backend)
      |                             |
      | 1. Write consumer test      |
      | 2. Generate pact file       |
      | 3. Publish to Pact Broker   |
      |                             |
      |          4. Backend pulls pact file
      |          5. Replays interactions against real provider
      |          6. Passes or fails CI
```

---

## Install

### Backend (provider)

```bash
npm install --save-dev @pact-foundation/pact
```

### Frontend (consumer)

```bash
npm install --save-dev @pact-foundation/pact
```

---

## Step 1 — Consumer Test (Frontend)

The frontend defines what it expects from the backend. This generates a `.json` pact file.

```ts
// frontend/src/__tests__/pact/auth.pact.test.ts
import { PactV3, MatchersV3 } from '@pact-foundation/pact';
import path from 'path';
import axios from 'axios';

const { like, string } = MatchersV3;

const provider = new PactV3({
  consumer: 'socialflow-frontend',
  provider: 'socialflow-backend',
  dir: path.resolve(__dirname, '../../../pacts'),
});

describe('Auth API contract', () => {
  it('returns a token on valid login', async () => {
    await provider
      .given('a user exists with valid credentials')
      .uponReceiving('a POST /auth/login request')
      .withRequest({
        method: 'POST',
        path: '/auth/login',
        headers: { 'Content-Type': 'application/json' },
        body: { email: 'user@example.com', password: 'secret' },
      })
      .willRespondWith({
        status: 200,
        headers: { 'Content-Type': like('application/json') },
        body: {
          token: string('eyJhbGciOiJIUzI1NiJ9...'),
          user: {
            id: string('user_123'),
            email: string('user@example.com'),
          },
        },
      })
      .executeTest(async (mockServer) => {
        const res = await axios.post(`${mockServer.url}/auth/login`, {
          email: 'user@example.com',
          password: 'secret',
        });
        expect(res.status).toBe(200);
        expect(res.data.token).toBeDefined();
      });
  });
});
```

Run the consumer test to generate the pact file:

```bash
npx jest auth.pact.test.ts
# outputs: pacts/socialflow-frontend-socialflow-backend.json
```

---

## Step 2 — Publish Pact to Broker

### Option A — Pact Broker (hosted or self-hosted)

```bash
npx pact-broker publish ./pacts \
  --broker-base-url https://your-broker.pactflow.io \
  --broker-token $PACT_BROKER_TOKEN \
  --consumer-app-version $(git rev-parse --short HEAD) \
  --branch $(git branch --show-current)
```

### Option B — Local file sharing (no broker)

Copy the generated `.json` pact file directly into the backend repo:

```
backend/pacts/socialflow-frontend-socialflow-backend.json
```

---

## Step 3 — Provider Verification (Backend)

The backend replays every interaction from the pact file against the running app and confirms the responses match.

```ts
// backend/src/__tests__/pact/provider.pact.test.ts
import { Verifier } from '@pact-foundation/pact';
import path from 'path';
import app from '../../app';
import { createServer } from 'http';

describe('Pact provider verification', () => {
  let server: ReturnType<typeof createServer>;
  let port: number;

  beforeAll((done) => {
    server = createServer(app);
    server.listen(0, () => {
      port = (server.address() as any).port;
      done();
    });
  });

  afterAll((done) => server.close(done));

  it('validates all consumer contracts', async () => {
    await new Verifier({
      provider: 'socialflow-backend',
      providerBaseUrl: `http://localhost:${port}`,

      // Local pact files
      pactUrls: [
        path.resolve(__dirname, '../../../pacts/socialflow-frontend-socialflow-backend.json'),
      ],

      // Or pull from broker:
      // pactBrokerUrl: process.env.PACT_BROKER_URL,
      // pactBrokerToken: process.env.PACT_BROKER_TOKEN,
      // consumerVersionSelectors: [{ mainBranch: true }, { deployedOrReleased: true }],

      // State handlers — seed DB state per interaction
      stateHandlers: {
        'a user exists with valid credentials': async () => {
          // seed a test user or mock prisma
        },
      },

      publishVerificationResult: process.env.CI === 'true',
      providerVersion: process.env.GIT_SHA ?? 'local',
      providerVersionBranch: process.env.GIT_BRANCH ?? 'local',
    }).verifyProvider();
  });
});
```

Run provider verification:

```bash
npx jest provider.pact.test.ts --runInBand
```

---

## Step 4 — CI Integration

Add to `.github/workflows/ci.yml`:

```yaml
pact-verify:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4

    - name: Install dependencies
      run: npm ci
      working-directory: backend

    - name: Run provider verification
      working-directory: backend
      env:
        CI: true
        GIT_SHA: ${{ github.sha }}
        GIT_BRANCH: ${{ github.ref_name }}
        PACT_BROKER_URL: ${{ secrets.PACT_BROKER_URL }}
        PACT_BROKER_TOKEN: ${{ secrets.PACT_BROKER_TOKEN }}
      run: npx jest provider.pact.test.ts --runInBand
```

---

## Standard Interactions to Contract-Test

| Consumer action | Endpoint | Key assertions |
|---|---|---|
| Login | `POST /auth/login` | `token`, `user.id`, `user.email` |
| Get profile | `GET /auth/me` | `id`, `email`, `role` |
| List webhooks | `GET /webhooks` | array shape, `id`, `url`, `events` |
| Create webhook | `POST /webhooks` | `id`, `secret` returned once |
| Get organization | `GET /organizations/:id` | `id`, `name`, `plan` |

---

## Tips

- Use `like()` and `string()` matchers — avoid asserting exact values, focus on shape and type.
- Keep state handlers lightweight — mock Prisma or use a test DB seeder.
- Run consumer tests on the frontend CI, provider tests on the backend CI.
- Use `can-i-deploy` in your release pipeline to block deploys that would break a consumer:

```bash
npx pact-broker can-i-deploy \
  --pacticipant socialflow-backend \
  --version $GIT_SHA \
  --to-environment production \
  --broker-base-url $PACT_BROKER_URL \
  --broker-token $PACT_BROKER_TOKEN
```
