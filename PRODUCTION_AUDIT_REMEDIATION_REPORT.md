# Production Audit Remediation Report

## Implemented Issues

### Broken access control on tool jobs

- Category: Security / Authorization
- Severity: Critical
- Files: `app/Http/Controllers/Api/Tools/*Controller.php`, `app/Http/Traits/AuthorizesToolJobs.php`

Problem: Tool status and download endpoints fetched jobs directly by `job_id`.

Current code pattern:

```php
$toolJob = ToolJob::where('job_id', $jobId)->firstOrFail();
```

Risk: Any leaked or guessed job UUID could expose another user's status, generated files, AI output, or extracted PDF text.

Recommended and implemented fix:

```php
$toolJob = $this->findAuthorizedToolJob($jobId, 'merge_pdf');
```

Explanation: The shared trait validates UUID format, scopes by tool type where applicable, and blocks access when the job belongs to another authenticated user.

Impact: Stronger access control, less duplicated code, and consistent behavior across tools.

### Unsafe download path trust

- Category: Security / File Handling
- Severity: High
- Files: `app/Http/Traits/AuthorizesToolJobs.php`, tool download controllers

Problem: Several endpoints passed database-backed `output_file` values directly to `Storage::download()`.

Current code pattern:

```php
return Storage::disk('temp')->download($toolJob->output_file, $filename);
```

Risk: A corrupted job record could lead to path traversal or unintended private file reads.

Recommended and implemented fix:

```php
$this->assertSafeTempPath($toolJob->output_file);
return Storage::disk('temp')->download($toolJob->output_file, $filename);
```

Explanation: The helper rejects absolute paths, null bytes, `..` segments, missing files, and real paths outside `storage/app/temp`.

Impact: Safer file downloads and reusable file-output validation.

### Missing baseline tool throttling

- Category: Security / Rate Limiting
- Severity: Medium
- File: `routes/api.php`

Problem: Newer tool routes did not all have explicit throttles.

Current code:

```php
Route::prefix('tools')->middleware(['guest.limit'])->group(function () {
```

Implemented fix:

```php
Route::prefix('tools')->middleware(['guest.limit', 'throttle:120,1'])->group(function () {
```

Impact: Reduces scraping, polling abuse, and compute-amplification risk while preserving stricter endpoint throttles.

### Weak database integrity

- Category: Database / Data Integrity
- Severity: High
- Files: `database/migrations/2024_01_01_000001_create_tool_jobs_table.php`, `database/migrations/2024_01_01_000003_create_organizations_table.php`

Problem: `tool_jobs.user_id` was a nullable string without a foreign key, and organization memberships could duplicate.

Implemented fix: converted fresh-install schema to `foreignId(...)->constrained()->nullOnDelete()`, added composite indexes, owner constraints, organization job indexes, and unique organization-user membership.

Impact: Better referential integrity, faster dashboard/status queries, fewer orphaned or duplicate records.

### Over-fetching on dashboard and organizations

- Category: Performance
- Severity: Medium
- Files: `app/Http/Controllers/Api/DashboardController.php`, `app/Http/Controllers/Api/OrganizationController.php`

Problem: Dashboard loaded user data that was not returned. Organization index loaded full members and jobs for every organization.

Implemented fix: removed unused eager loading, returned counts on organization index, and constrained detailed loading to the show endpoint.

Impact: Less model hydration, lower memory usage, better scalability for organizations with many members/jobs.

### Frontend/API response shape mismatch

- Category: Reliability / Frontend Integration
- Severity: High
- Files: `resources/js/utils/api.ts`, `resources/js/hooks/usePdfTool.ts`, `app/Http/Traits/PerformsUploadValidation.php`

Problem: The frontend assumed every successful API response nested payloads under `data`, while several Laravel endpoints return flattened payloads.

Implemented fix: added an API `unwrap()` helper, made `usePdfTool` accept nested or flattened responses, and preserved nested `data` in upload validation responses.

Impact: Prevents false upload/status failures and improves typed error handling.

### Image-to-PDF option validation rejected valid clients

- Category: Validation / Reliability
- Severity: Medium
- File: `app/Http/Requests/ImageToPdfRequest.php`

Problem: Options were required/validated inconsistently and uppercase page sizes such as `A4` failed validation.

Implemented fix: `prepareForValidation()` now accepts JSON or array options and normalizes page size/orientation before validation.

Impact: Preserves frontend behavior while keeping server-side validation strict.

## Remaining High-Priority Issues

### PDF passwords stored in job metadata

- Category: Sensitive Data Exposure
- Severity: High
- Files: `ProtectPdfController`, `UnlockPdfController`, related jobs/services

Problem: User-supplied PDF passwords are stored in `metadata`.

Risk: Passwords can persist in the database, backups, logs, and debug tooling.

Recommended fix: Store passwords only in encrypted short-lived cache or encrypted job payloads, remove them immediately after job completion, and never include them in serialized job metadata.

### API auth contract mismatch

- Category: Authentication Architecture
- Severity: High
- Files: `AuthController`, `resources/js/utils/api.ts`, `resources/js/hooks/useAuth.ts`

Problem: Backend issues Sanctum bearer tokens, while frontend comments and configuration assume httpOnly cookie auth.

Risk: Authentication can appear successful while authenticated API calls fail, or tokens may be mishandled client-side.

Recommended fix: Choose one production model: SPA cookie auth with Sanctum stateful middleware and no token in JSON, or bearer-token auth with explicit secure storage and rotation strategy.

### Test drift

- Category: Testing / Security Expectations
- Severity: Medium
- Files: `tests/Feature/ImageToPdfTest.php`, `tests/Feature/SplitWatermarkTest.php`

Problem: Tests expect non-UUID job IDs to work and guest dashboard activity to be publicly readable.

Risk: Those expectations conflict with production security hardening.

Recommended fix: Update tests to use UUIDs and authenticated dashboard access.

## Prioritized Refactoring Plan

### Quick Wins

1. Update failing tests to match UUID-only jobs and authenticated dashboard access.
2. Remove stale `options.json` validation message from `ImageToPdfRequest`.
3. Standardize all upload responses to `success + data` while keeping backward-compatible top-level fields for one release.

### Short-Term Refactors

1. Move all PDF tool upload validation to FormRequest classes.
2. Replace repeated controller upload storage code with a `ToolUploadService`.
3. Add policies or explicit service-level authorization for organization-scoped jobs.

### Medium Refactors

1. Remove passwords from persistent job metadata.
2. Standardize Sanctum auth mode and update frontend/backend contracts.
3. Add integration tests for cross-user job status/download denial.

### Major Refactors

1. Introduce a typed job state machine instead of free-form status strings.
2. Move CPU-heavy and AI PDF analysis behind queues with idempotency and retry policy.
3. Introduce tenant-aware organization boundaries for all job queries.
