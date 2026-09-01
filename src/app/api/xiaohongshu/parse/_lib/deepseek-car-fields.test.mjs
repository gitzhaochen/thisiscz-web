import assert from 'node:assert/strict'
import test from 'node:test'
import {
  DeepSeekCarParserError,
  extractCarFieldsWithDeepSeek,
  parseAndValidateDeepSeekContent,
} from './deepseek-car-fields.ts'

test('accepts valid high-confidence fields with exact evidence', () => {
  const result = parseAndValidateDeepSeekContent(
    JSON.stringify({
      fields: {
        price: { value: 18500, confidence: 0.98, evidence: '售价 $18,500' },
        mileageKm: { value: 82000, confidence: 0.95, evidence: '8.2万公里' },
        city: { value: 'Auckland', confidence: 0.9, evidence: '奥克兰' },
      },
    }),
    '奥克兰个人卖车，售价 $18,500，行驶 8.2万公里',
  )

  assert.equal(result.price?.value, 18500)
  assert.equal(result.mileageKm?.value, 82000)
  assert.equal(result.city?.value, 'Auckland')
})

test('accepts an AI-normalized masked NZD price', () => {
  const result = parseAndValidateDeepSeekContent(
    JSON.stringify({
      fields: {
        price: { value: 7500, confidence: 0.98, evidence: '75**刀' },
        currency: { value: 'NZD', confidence: 0.9, evidence: '75**刀' },
      },
    }),
    '奥克兰卖车，价格75**刀',
  )

  assert.equal(result.price?.value, 7500)
  assert.equal(result.currency?.value, 'NZD')
})

test('rejects low-confidence fields and evidence not present in source', () => {
  const result = parseAndValidateDeepSeekContent(
    JSON.stringify({
      fields: {
        year: { value: 2019, confidence: 0.5, evidence: '2019' },
        model: { value: 'Corolla', confidence: 0.99, evidence: 'Corolla' },
      },
    }),
    '2019 丰田出售',
  )

  assert.equal(result.year, undefined)
  assert.equal(result.model, undefined)
})

test('rejects invalid enum values and malformed JSON', () => {
  assert.throws(
    () =>
      parseAndValidateDeepSeekContent(
        JSON.stringify({
          fields: {
            fuelType: { value: 'hydrogen', confidence: 0.99, evidence: 'hydrogen' },
          },
        }),
        'hydrogen',
      ),
    (error) => error instanceof DeepSeekCarParserError && error.code === 'invalid_schema',
  )

  assert.throws(
    () => parseAndValidateDeepSeekContent('not json', 'source'),
    (error) => error instanceof DeepSeekCarParserError && error.code === 'invalid_json',
  )
})

test('uses DeepSeek JSON mode once and reports usage', async () => {
  const previousFetch = globalThis.fetch
  const previousKey = process.env.DEEPSEEK_API_KEY
  let calls = 0
  let requestBody

  process.env.DEEPSEEK_API_KEY = 'test-key'
  globalThis.fetch = async (_url, init) => {
    calls += 1
    requestBody = JSON.parse(String(init?.body))
    return new Response(
      JSON.stringify({
        model: 'deepseek-chat',
        choices: [
          {
            finish_reason: 'stop',
            message: {
              content: JSON.stringify({
                fields: {
                  manufacturer: { value: 'Toyota', confidence: 0.95, evidence: '丰田' },
                },
              }),
            },
          },
        ],
        usage: { prompt_tokens: 100, completion_tokens: 30, total_tokens: 130 },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    )
  }

  try {
    const result = await extractCarFieldsWithDeepSeek('丰田 Corolla', '个人卖车')
    assert.equal(calls, 1)
    assert.deepEqual(requestBody.response_format, { type: 'json_object' })
    assert.equal(requestBody.temperature, 0)
    assert.equal(result.fields.manufacturer?.value, 'Toyota')
    assert.equal(result.usage?.totalTokens, 130)
  } finally {
    globalThis.fetch = previousFetch
    if (previousKey === undefined) delete process.env.DEEPSEEK_API_KEY
    else process.env.DEEPSEEK_API_KEY = previousKey
  }
})

test('classifies timeout and truncated responses for safe API errors', async () => {
  const previousFetch = globalThis.fetch
  const previousKey = process.env.DEEPSEEK_API_KEY
  process.env.DEEPSEEK_API_KEY = 'test-key'

  try {
    globalThis.fetch = async () => {
      throw new DOMException('timed out', 'TimeoutError')
    }
    await assert.rejects(
      () => extractCarFieldsWithDeepSeek('title', 'content'),
      (error) => error instanceof DeepSeekCarParserError && error.code === 'timeout',
    )

    globalThis.fetch = async () =>
      new Response(
        JSON.stringify({
          choices: [{ finish_reason: 'length', message: { content: '{"fields":' } }],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      )
    await assert.rejects(
      () => extractCarFieldsWithDeepSeek('title', 'content'),
      (error) => error instanceof DeepSeekCarParserError && error.code === 'truncated_response',
    )
  } finally {
    globalThis.fetch = previousFetch
    if (previousKey === undefined) delete process.env.DEEPSEEK_API_KEY
    else process.env.DEEPSEEK_API_KEY = previousKey
  }
})
