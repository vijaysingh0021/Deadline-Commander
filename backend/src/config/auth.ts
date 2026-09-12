/** Returns the signing key only when authentication has been configured. */
export function jwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is required to enable the API');
  }
  return secret;
}
