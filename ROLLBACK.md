# Rollback guide: interactive portfolio enhancement

This file records exactly what the site looked like before the interactive
enhancement and how to get back to it. Recorded 2026-11-10.

## Reference points

| What | Value |
| --- | --- |
| Original baseline commit (live when the work started) | `7f57f7b07edb8032a637d0c5a05f8cdebd99a52e` |
| Backup ref (annotated tag, pushed to GitHub) | `backup/pre-interactive-2026-11-10` (tag object `45a866a`, points to `7f57f7b`) |
| Feature branch | `feat/interactive-portfolio` |
| `main` at the time the branch was prepared | `c6383ad` (= `7f57f7b` + one CV-only commit, see below) |

**Later change on `main` (not part of this enhancement):** after the baseline
was recorded, the CV PDF was updated on `main` at the owner's request, in commit
`c6383ad` ("Fix CV project date alignment"). It changes only `public/resume.pdf`
and was deployed. So production before this enhancement is `c6383ad`, not
`7f57f7b`. The feature branch merges `c6383ad` in, so it contains that CV too.

The baseline was checked by building tag `backup/pre-interactive-2026-11-10`
in a separate worktree (`npm ci && npm run build`: 1 page built, no errors).
None of the restore procedures below have been run against the real
repository; they are instructions, not tested operations.

## How publishing works (why the branch is safe)

- `.github/workflows/deploy.yml` runs only on `push` to `main` and on manual
  `workflow_dispatch`.
- The `github-pages` environment only accepts deployments from `main`
  (deployment branch policy: `main`).
- Pushing `feat/interactive-portfolio` or opening a pull request therefore
  does not build or publish the site. Production changes only when something
  is merged or pushed into `main`.

## A. Discard the experiment before it is merged

Production is untouched, so nothing needs restoring on the site.

1. Close the pull request without merging (if one is open).
2. Optionally delete the branch:
   ```bash
   git push origin --delete feat/interactive-portfolio
   git worktree remove ../portfolio-site-interactive
   git branch -D feat/interactive-portfolio
   ```
   Keep the `backup/pre-interactive-2026-11-10` tag.

## B. Reverse the enhancement after it has been merged

Use a revert commit or a revert PR. Do not reset `main` and do not force-push.
How depends on how the PR was merged (this repo allows merge commits, squash
and rebase):

- **Merge commit:** revert the merge, keeping `main`'s first parent:
  ```bash
  git switch main && git pull --ff-only
  git revert -m 1 <merge-commit-sha>
  git push origin main
  ```
  GitHub's "Revert" button on the merged PR does the same thing through a new PR.
- **Squash merge:** revert the single squashed commit:
  ```bash
  git revert <squashed-commit-sha>
  ```
- **Rebase merge:** revert each rebased commit, newest first:
  ```bash
  git revert <oldest-sha>^..<newest-sha>
  ```

The push to `main` redeploys the site automatically.

**What this does and does not restore.** A revert removes only the changes
introduced by this enhancement. Anything merged into `main` afterwards (for
example new content in `resume.yaml` or a new CV) stays. It is therefore not
an exact copy of the baseline if other changes landed later. That is usually
what you want. If you need the exact old source, use C.

## C. Recreate the exact baseline source as a new commit

Use this only when an exact restoration is explicitly wanted. It creates a new
commit on top of `main` whose files match the chosen reference exactly. History
is kept and nothing is force-pushed. It also discards every later change,
including content edits, so check `git diff` before committing.

Choose the reference:
- `c6383ad`: production right before this enhancement (baseline plus the CV fix)
- `backup/pre-interactive-2026-11-10` (`7f57f7b`): the original baseline (older CV)

```bash
git switch main && git pull --ff-only
git switch -c restore/pre-interactive
git restore --source=c6383ad --staged --worktree -- .
git status            # review: files added by the enhancement show as deleted
git diff --cached     # review everything that will change
git commit -m "Restore site source to c6383ad (pre-interactive)"
git push origin restore/pre-interactive
# open a PR from restore/pre-interactive into main, review, then merge
```

`git restore --source=<ref> -- .` also removes files that do not exist in the
reference (for example `src/scripts/field.ts`, `src/scripts/ui.ts` and this
file), so the result matches the reference tree exactly.

## Preview the baseline locally

```bash
git worktree add --detach ../portfolio-baseline backup/pre-interactive-2026-11-10
cd ../portfolio-baseline && npm ci && npm run build && npx astro preview
# open http://localhost:4321/portfolio-site/
```
