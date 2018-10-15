import { resolvers } from 'src/features/registration/root-resolvers'
import * as fetch from 'jest-fetch-mock'

describe('Registration root resolvers', () => {
  describe('listBirthRegistrations()', () => {
    it('returns an array of composition results', async () => {
      fetch.mockResponseOnce(JSON.stringify({ entry: [{}, {}] }))
      // @ts-ignore
      const compositions = await resolvers.Query.listBirthRegistrations(
        {},
        { status: 'preliminary' }
      )

      expect(compositions).toBeDefined()
      expect(compositions).toBeInstanceOf(Array)
      expect(compositions).toHaveLength(2)
    })
  })

  describe('createBirthRegistration()', () => {
    it('posts a fhir bundle', async () => {
      fetch.mockResponseOnce(
        JSON.stringify({
          resourceType: 'Bundle',
          entry: [
            {
              response: { location: 'Patient/12423/_history/1' }
            }
          ]
        })
      )
      // @ts-ignore
      const result = await resolvers.Mutation.createBirthRegistration(
        {},
        { createAt: new Date() }
      )

      expect(result).toBeDefined()
      expect(result).toBe('1')
      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method: 'POST' })
      )
    })

    it('throws an error when the request returns an error code', async () => {
      fetch.mockResponseOnce('Boom!', { status: 401 })
      await expect(
        // @ts-ignore
        resolvers.Mutation.createBirthRegistration(
          {},
          { createdAt: new Date() }
        )
      ).rejects.toThrowError('FHIR post to /fhir failed with [401] body: Boom!')
    })

    it("throws an error when the response isn't what we expect", async () => {
      fetch.mockResponseOnce(JSON.stringify({ unexpected: true }))
      await expect(
        // @ts-ignore
        resolvers.Mutation.createBirthRegistration(
          {},
          { createdAt: new Date() }
        )
      ).rejects.toThrowError('FHIR response did not send a valid response')
    })
  })
})
