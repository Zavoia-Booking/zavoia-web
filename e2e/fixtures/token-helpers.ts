import { createHash, randomBytes } from 'node:crypto'
import { withTestDb } from './test-db'

/**
 * Every emailed-link flow (verify-email, forgot/reset-password,
 * verify-account-link, team invitations, ...) stores a SHA-256 HASH of the
 * token in `verification_token.token`, never the raw value — see
 * admin-api/src/utils/utilFunctions.ts (generateEmailVerificationToken,
 * generatePasswordResetToken, generateInvitationToken, all identical
 * `randomBytes(32).toString('hex')` + `sha256(...)`) and
 * admin-api/src/entities/verificationToken.entity.ts (TokenType enum, FK
 * column `userId`, `used`/`expiresAt` columns).
 *
 * Since EMAIL_SEND_ENABLED=false in the test env, no email is ever sent —
 * the app still creates the real DB row when you trigger the real action
 * (register, POST /marketplace/auth/forgot-password, etc.), we just can't
 * read the raw token back out of it (only its hash is stored). So: let the
 * real action create the row, then "rotate" that row's hash to a token we
 * minted ourselves and can put in a URL. Mirrors
 * admin-dashboard/e2e/fixtures/test-helpers.ts's rotateLatestInvitationToken.
 */
export type VerificationTokenType =
  | 'EMAIL_VERIFICATION'
  | 'PASSWORD_RESET'
  | 'EMAIL_CHANGE'
  | 'TEAM_INVITATION'
  | 'BUSINESS_ACCOUNT_LINK'
  | 'MOBILE_REGISTER_INVITE'

/**
 * Finds the most recent UNUSED token of `type` for the user with `email`
 * (created by the real API action you just triggered), overwrites its
 * stored hash with a hash of a token we generate, and returns the raw
 * token — put it straight into the URL, e.g.
 * `/auth/verify-email?token=${rawToken}`.
 */
export async function rotateLatestToken(email: string, type: VerificationTokenType): Promise<string> {
  const rawToken = randomBytes(32).toString('hex')
  const tokenHash = createHash('sha256').update(rawToken).digest('hex')

  await withTestDb(async (client) => {
    const res = await client.query(
      `UPDATE verification_token
         SET token = $1
       WHERE id = (
         SELECT vt.id
           FROM verification_token vt
           JOIN "user" u ON u.id = vt."userId"
          WHERE u.email = $2
            AND vt.type = $3
            AND vt.used = false
          ORDER BY vt."createdAt" DESC
          LIMIT 1
       )`,
      [tokenHash, email, type],
    )
    if (res.rowCount === 0) {
      throw new Error(
        `No active ${type} token found for ${email} — did the API call that should have created it (register / forgot-password / send-account-link / ...) actually run first, and succeed?`,
      )
    }
  })

  return rawToken
}

/** Marks the latest unused token of `type` for `email` as already used, without consuming it through the UI — for "reused/expired link" negative tests. */
export async function markLatestTokenUsed(email: string, type: VerificationTokenType): Promise<void> {
  await withTestDb(async (client) => {
    await client.query(
      `UPDATE verification_token
         SET used = true, "usedAt" = NOW()
       WHERE id = (
         SELECT vt.id
           FROM verification_token vt
           JOIN "user" u ON u.id = vt."userId"
          WHERE u.email = $1 AND vt.type = $2 AND vt.used = false
          ORDER BY vt."createdAt" DESC
          LIMIT 1
       )`,
      [email, type],
    )
  })
}

/** Backdates the latest unused token of `type` for `email` so it reads as expired. */
export async function expireLatestToken(email: string, type: VerificationTokenType): Promise<void> {
  await withTestDb(async (client) => {
    await client.query(
      `UPDATE verification_token
         SET "expiresAt" = NOW() - interval '1 day'
       WHERE id = (
         SELECT vt.id
           FROM verification_token vt
           JOIN "user" u ON u.id = vt."userId"
          WHERE u.email = $1 AND vt.type = $2 AND vt.used = false
          ORDER BY vt."createdAt" DESC
          LIMIT 1
       )`,
      [email, type],
    )
  })
}
