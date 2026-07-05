## Challenge Summary

**Overall risk assessment**: HIGH (Due to syntax error blocking build and critical E2E tests, and some potential race conditions on async triggers)

## Challenges

### Major Challenge 1: Unhandled Promises / Race Conditions on Pack Opening and Match Reset

- **Assumption challenged**: Clicking buttons like "Resetar Partida" or opening a pack assumes that the user will not trigger double clicks while async operations are in progress.
- **Attack scenario**: A user rapidly clicks "Resetar Partida" or double-clicks a pack button. In `main.js:openPack`, the local state is modified synchronously before making the async call to Supabase. If the network call is slow and multiple calls resolve in random order, it could result in inconsistent state or multiple pack updates.
- **Blast radius**: User collections could become corrupted, or database logs could show duplicate entries.
- **Mitigation**: Disable buttons immediately upon click (e.g., using a loading state/disabled attribute) and ensure the callback prevents re-entry.

### Medium Challenge 2: CORS Proxy Reliability and Malformed JSON Response Error Masking

- **Assumption challenged**: The corsproxy.io service is assumed to be 100% reliable, and the Decks of Keyforge API format is assumed to never change.
- **Attack scenario**: If Decks of Keyforge modifies its API schema (e.g., `sasRating` is renamed or missing), `parseDokResponse` will throw an error. In `fetchDeck()`, the `catch (err)` block treats all errors (network and parsing) as "Erro ao buscar o deck. Verifique a conexão." (Error fetching deck. Check connection).
- **Blast radius**: The user will see a generic network connection error, masking the fact that the proxy is dead or the parsing failed, making it difficult to debug.
- **Mitigation**: Differentiate between network errors and schema parsing errors in `catch (err)` blocks and output appropriate errors.

### Medium Challenge 3: Stepper Bounds and Input Validation on Client Side

- **Assumption challenged**: The key steppers are assumed to be safe because buttons are disabled when keys are `< 0` or `>= 3`.
- **Attack scenario**: If a user inspects the element and manually edits the DOM or uses developer tools to call the actions directly with arbitrary parameters (e.g. `setKeys('a', 5)`), the validation check `mk < 0 || mk > 3` inside `validateScore` will reject the local score representation. However, if they directly invoke the database RPC `dbSubmitSingleReport` with malicious inputs, it could bypass local checks.
- **Blast radius**: Potential DB corruptions if constraints are not enforced at the database schema/RPC level.
- **Mitigation**: Ensure database table constraints (CHECK constraints on key values) are configured correctly to reject scores out of [0, 3] range.

## Stress Test Results

- **Build / Compile Scenario**: Compile main bundle using Vite -> Expected: Success -> Actual: FAIL (`await isn't allowed in non-async function`)
- **E2E Smoke Checks Scenario**: Navigate to login and authenticate -> Expected: Successful transition -> Actual: FAIL (Timouts due to unparsed bundle)
- **E2E Score Validation Scenario**: Input invalid score parameters -> Expected: Block and show error alert -> Actual: FAIL (E2E test timed out due to bundle loading error)

## Unchallenged Areas

- Remote database configuration and security policies (RLS/RPC schemas) — reasons: Out of scope of the frontend codebase inspection and the live database was mocked during E2E runs.
