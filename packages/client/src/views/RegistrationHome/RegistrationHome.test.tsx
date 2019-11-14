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
import { Spinner } from '@opencrvs/components/lib/interface'
import { checkAuth } from '@client/profile/profileActions'
import { queries } from '@client/profile/queries'
import { storage } from '@client/storage'
import { createStore } from '@client/store'
import { createTestComponent, mockUserResponse } from '@client/tests/util'
import { REGISTRATION_HOME_QUERY } from '@client/views/RegistrationHome/queries'
import {
  RegistrationHome,
  EVENT_STATUS
} from '@client/views/RegistrationHome/RegistrationHome'
import { merge } from 'lodash'
import * as React from 'react'
import { storeApplication, createApplication } from '@client/applications'
import { Event } from '@client/forms'

const registerScopeToken =
  'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzY29wZSI6WyJyZWdpc3RlciIsImNlcnRpZnkiLCJkZW1vIl0sImlhdCI6MTU0MjY4ODc3MCwiZXhwIjoxNTQzMjkzNTcwLCJhdWQiOlsib3BlbmNydnM6YXV0aC11c2VyIiwib3BlbmNydnM6dXNlci1tZ250LXVzZXIiLCJvcGVuY3J2czpoZWFydGgtdXNlciIsIm9wZW5jcnZzOmdhdGV3YXktdXNlciIsIm9wZW5jcnZzOm5vdGlmaWNhdGlvbi11c2VyIiwib3BlbmNydnM6d29ya2Zsb3ctdXNlciJdLCJpc3MiOiJvcGVuY3J2czphdXRoLXNlcnZpY2UiLCJzdWIiOiI1YmVhYWY2MDg0ZmRjNDc5MTA3ZjI5OGMifQ.ElQd99Lu7WFX3L_0RecU_Q7-WZClztdNpepo7deNHqzro-Cog4WLN7RW3ZS5PuQtMaiOq1tCb-Fm3h7t4l4KDJgvC11OyT7jD6R2s2OleoRVm3Mcw5LPYuUVHt64lR_moex0x_bCqS72iZmjrjS-fNlnWK5zHfYAjF2PWKceMTGk6wnI9N49f6VwwkinJcwJi6ylsjVkylNbutQZO0qTc7HRP-cBfAzNcKD37FqTRNpVSvHdzQSNcs7oiv3kInDN5aNa2536XSd3H-RiKR9hm9eID9bSIJgFIGzkWRd5jnoYxT70G0t03_mTVnDnqPXDtyI-lmerx24Ost0rQLUNIg'
const getItem = window.localStorage.getItem as jest.Mock

const mockFetchUserDetails = jest.fn()

const nameObj = {
  data: {
    getUser: {
      name: [
        {
          use: 'en',
          firstNames: 'Mohammad',
          familyName: 'Ashraful',
          __typename: 'HumanName'
        },
        { use: 'bn', firstNames: '', familyName: '', __typename: 'HumanName' }
      ],
      role: 'DISTRICT_REGISTRAR'
    }
  }
}
merge(mockUserResponse, nameObj)
mockFetchUserDetails.mockReturnValue(mockUserResponse)
queries.fetchUserDetails = mockFetchUserDetails

storage.getItem = jest.fn()
storage.setItem = jest.fn()

const { store } = createStore()
beforeAll(() => {
  getItem.mockReturnValue(registerScopeToken)
  store.dispatch(checkAuth({ '?token': registerScopeToken }))
})

describe('RegistrationHome In Progress tab related tests', () => {
  it('sets loading state while waiting for data', async () => {
    const testComponent = await createTestComponent(
      // @ts-ignore
      <RegistrationHome
        match={{
          params: {
            tabId: 'progress'
          },
          isExact: true,
          path: '',
          url: ''
        }}
      />,
      store
    )

    // @ts-ignore
    expect(testComponent.component.containsMatchingElement(Spinner)).toBe(true)
  })

  it('renders page with four tabs', async () => {
    const graphqlMock = [
      {
        request: {
          query: REGISTRATION_HOME_QUERY,
          variables: {
            locationIds: ['2a83cf14-b959-47f4-8097-f75a75d1867f'],
            count: 10,
            reviewStatuses: [EVENT_STATUS.DECLARED, EVENT_STATUS.VALIDATED],
            inProgressSkip: 0,
            reviewSkip: 0,
            rejectSkip: 0,
            approvalSkip: 0,
            printSkip: 0
          }
        },
        result: {
          data: {
            inProgressTab: { totalItems: 0, results: [] },
            reviewTab: { totalItems: 0, results: [] },
            rejectTab: { totalItems: 0, results: [] },
            approvalTab: { totalItems: 0, results: [] },
            printTab: { totalItems: 7, results: [] }
          }
        }
      }
    ]
    const testComponent = await createTestComponent(
      // @ts-ignore
      <RegistrationHome match={{ params: { tabId: 'progress' } }} />,
      store,
      graphqlMock
    )

    // wait for mocked data to load mockedProvider
    await new Promise(resolve => {
      setTimeout(resolve, 100)
    })

    testComponent.component.update()
    const app = testComponent.component
    app
      .find('#tab_progress')
      .hostNodes()
      .simulate('click')
    app
      .find('#tab_review')
      .hostNodes()
      .simulate('click')
    app
      .find('#tab_updates')
      .hostNodes()
      .simulate('click')
    app
      .find('#tab_print')
      .hostNodes()
      .simulate('click')
  })

  it('renders in progress tab with total count of local and remote drafts', async () => {
    const graphqlMock = [
      {
        request: {
          query: REGISTRATION_HOME_QUERY,
          variables: {
            locationIds: ['2a83cf14-b959-47f4-8097-f75a75d1867f'],
            count: 10,
            reviewStatuses: [EVENT_STATUS.DECLARED, EVENT_STATUS.VALIDATED],
            inProgressSkip: 0,
            reviewSkip: 0,
            rejectSkip: 0,
            approvalSkip: 0,
            printSkip: 0
          }
        },
        result: {
          data: {
            inProgressTab: { totalItems: 5, results: [] },
            reviewTab: { totalItems: 0, results: [] },
            rejectTab: { totalItems: 0, results: [] },
            approvalTab: { totalItems: 0, results: [] },
            printTab: { totalItems: 0, results: [] }
          }
        }
      }
    ]

    store.dispatch(storeApplication(createApplication(Event.BIRTH)))

    const testComponent = await createTestComponent(
      // @ts-ignore
      <RegistrationHome match={{ params: { tabId: 'progress' } }} />,
      store,
      graphqlMock
    )

    // wait for mocked data to load mockedProvider
    await new Promise(resolve => {
      setTimeout(resolve, 100)
    })

    testComponent.component.update()
    const app = testComponent.component
    expect(
      app
        .find('#tab_progress')
        .hostNodes()
        .text()
    ).toContain('In progress (6)')
  })
})