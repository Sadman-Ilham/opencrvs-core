/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * OpenCRVS is also distributed under the terms of the Civil Registration
 * & Healthcare Disclaimer located at http://opencrvs.org/license.
 *
 * Copyright (C) The OpenCRVS Authors. OpenCRVS and the OpenCRVS
 * graphic logo are (registered/a) trademark(s) of Plan International.
 */
import {
  mergeDeclaredApplications,
  filterProcessingApplications,
  filterProcessingApplicationsFromQuery
} from '.'
import { Event } from '@client/forms'

describe('query result filtering tests', () => {
  describe('.filterProcessingApplications()', () => {
    it(`return data if results isn't defined`, () => {
      const data = {}
      const returnVal = filterProcessingApplications(data, [''])
      expect(returnVal).toBe(data)
    })

    it(`removes null values from results`, () => {
      const data = { results: [{}, null, {}], totalItems: 3 }
      // @ts-ignore
      const returnVal = filterProcessingApplications(data, [''])
      expect(returnVal).toEqual({ results: [{}, {}], totalItems: 2 })
    })

    it(`filters out applications with ids in the supplied array`, () => {
      const data = {
        results: [{ id: '111' }, { id: '222' }, { id: '333' }],
        totalItems: 3
      }
      const returnVal = filterProcessingApplications(data, ['222'])
      expect(returnVal).toEqual({
        results: [{ id: '111' }, { id: '333' }],
        totalItems: 2
      })
    })
  })

  describe('.filterProcessingApplicationsFromQuery()', () => {
    it('filters out applications in processing state from application query results', () => {
      const queryData = {
        inProgressTab: {
          results: [
            { id: 'DRAFT' },
            { id: 'READY_TO_SUBMIT' },
            { id: 'SUBMITTING' },
            { id: 'SUBMITTED' },
            { id: 'DRAFT' }
          ],
          totalItems: 5
        },
        notificationTab: {
          results: [
            { id: 'DRAFT' },
            { id: 'READY_TO_SUBMIT' },
            { id: 'SUBMITTING' },
            { id: 'SUBMITTED' },
            { id: 'DRAFT' }
          ],
          totalItems: 5
        },
        reviewTab: {
          results: [
            { id: 'READY_TO_REGISTER' },
            { id: 'REGISTERING' },
            { id: 'REGISTERED' },
            { id: 'FAILED_NETWORK' },
            { id: 'REGISTERING' }
          ],
          totalItems: 5
        },
        rejectTab: {
          results: [
            { id: 'READY_TO_REJECT' },
            { id: 'REJECTING' },
            { id: 'REJECTED' },
            { id: 'REJECTING' },
            { id: 'READY_TO_REJECT' }
          ],
          totalItems: 5
        },
        approvalTab: {
          results: [
            { id: 'READY_TO_APPROVE' },
            { id: 'APPROVING' },
            { id: 'APPROVED' },
            { id: 'READY_TO_APPROVE' },
            { id: 'APPROVING' }
          ],
          totalItems: 5
        },
        printTab: {
          results: [
            { id: 'READY_TO_CERTIFY' },
            { id: 'CERTIFYING' },
            { id: 'CERTIFIED' },
            { id: 'FAILED' },
            { id: 'CERTIFYING' }
          ],
          totalItems: 5
        }
      }

      const storedApplications = [
        {
          id: 'DRAFT',
          submissionStatus: 'DRAFT'
        },
        {
          id: 'READY_TO_SUBMIT',
          submissionStatus: 'READY_TO_SUBMIT'
        },
        {
          id: 'SUBMITTING',
          submissionStatus: 'SUBMITTING'
        },
        {
          id: 'SUBMITTED',
          submissionStatus: 'SUBMITTED'
        },
        {
          id: 'READY_TO_APPROVE',
          submissionStatus: 'READY_TO_APPROVE'
        },
        {
          id: 'APPROVING',
          submissionStatus: 'APPROVING'
        },
        {
          id: 'APPROVED',
          submissionStatus: 'APPROVED'
        },
        {
          id: 'READY_TO_REGISTER',
          submissionStatus: 'READY_TO_REGISTER'
        },
        {
          id: 'REGISTERING',
          submissionStatus: 'REGISTERING'
        },
        {
          id: 'REGISTERED',
          submissionStatus: 'REGISTERED'
        },
        {
          id: 'READY_TO_REJECT',
          submissionStatus: 'READY_TO_REJECT'
        },
        {
          id: 'REJECTING',
          submissionStatus: 'REJECTING'
        },
        {
          id: 'REJECTED',
          submissionStatus: 'REJECTED'
        },
        {
          id: 'READY_TO_CERTIFY',
          submissionStatus: 'READY_TO_CERTIFY'
        },
        {
          id: 'CERTIFYING',
          submissionStatus: 'CERTIFYING'
        },
        {
          id: 'CERTIFIED',
          submissionStatus: 'CERTIFIED'
        },
        {
          id: 'FAILED',
          submissionStatus: 'FAILED'
        },
        {
          id: 'FAILED_NETWORK',
          submissionStatus: 'FAILED_NETWORK'
        }
      ]

      const filteredResult = filterProcessingApplicationsFromQuery(
        queryData,
        // @ts-ignore
        storedApplications
      )

      expect(filteredResult).toEqual({
        inProgressTab: {
          results: [{ id: 'DRAFT' }, { id: 'SUBMITTED' }, { id: 'DRAFT' }],
          totalItems: 3
        },
        notificationTab: {
          results: [{ id: 'DRAFT' }, { id: 'SUBMITTED' }, { id: 'DRAFT' }],
          totalItems: 3
        },
        reviewTab: {
          results: [{ id: 'REGISTERED' }, { id: 'FAILED_NETWORK' }],
          totalItems: 2
        },
        rejectTab: {
          results: [{ id: 'REJECTED' }],
          totalItems: 1
        },
        approvalTab: {
          results: [{ id: 'APPROVED' }],
          totalItems: 1
        },
        printTab: {
          results: [{ id: 'CERTIFIED' }, { id: 'FAILED' }],
          totalItems: 2
        }
      })
    })
  })
})

describe('Utilty functions', () => {
  it('fetch declared applications', () => {})
  it('merges applications', () => {
    const applications = [
      {
        id: '1',
        data: {},
        event: Event.BIRTH,
        compositionId: '1'
      },
      {
        id: '2',
        data: {},
        event: Event.DEATH,
        compositionId: '2'
      }
    ]
    const declaredApplications = [
      {
        id: '2'
      },
      {
        id: '3'
      }
    ]

    mergeDeclaredApplications(applications, declaredApplications)

    expect(applications).toHaveLength(3)
  })
})
