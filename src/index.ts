import { randomBytes, createHash } from "node:crypto"
import { promisify } from "node:util"
import bs58 from "bs58"

export const hashLongToken = (longToken: string) =>
  createHash("sha256").update(longToken).digest("hex")

export interface GenerateAPIKeyOptions {
  keyPrefix?: string
  shortTokenPrefix?: string
  shortTokenLength?: number
  longTokenLength?: number
}

export const generateAPIKey = async ({
  keyPrefix,
  shortTokenPrefix = "",
  shortTokenLength = 8,
  longTokenLength = 24,
}: GenerateAPIKeyOptions = {}) => {
  if (!keyPrefix) return {}

  const generatedRandomBytes = promisify(randomBytes)
  const [shortTokenBytes, longTokenBytes] = await Promise.all([
    // you need ~0.732 * length bytes, but it's fine to have more bytes
    generatedRandomBytes(shortTokenLength),
    generatedRandomBytes(longTokenLength),
  ])

  let shortToken = bs58.encode(shortTokenBytes).padStart(
    shortTokenLength,
    "0"
  ).slice(0, shortTokenLength)

  const longToken = bs58.encode(longTokenBytes).padStart(
    longTokenLength,
    "0"
  ).slice(0, longTokenLength)

  const longTokenHash = hashLongToken(longToken)

  shortToken = (shortTokenPrefix + shortToken).slice(0, shortTokenLength)

  const token = `${keyPrefix}_${shortToken}_${longToken}`

  return { shortToken, longToken, longTokenHash, token }
}

export const extractLongToken = (token: string) =>
  token.split("_").slice(-1)?.[0]

export const extractShortToken = (token: string) => token.split("_")?.[1]

export const extractLongTokenHash = (token: string) =>
  hashLongToken(extractLongToken(token))

export const getTokenComponents = (token: string) => ({
  longToken: extractLongToken(token),
  shortToken: extractShortToken(token),
  longTokenHash: hashLongToken(extractLongToken(token)),
  token,
})

export const checkAPIKey = async (
  token: string,
  expectedLongTokenHash: string
) => hashLongToken(extractLongToken(token)) === expectedLongTokenHash
