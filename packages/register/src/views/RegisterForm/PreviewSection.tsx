import * as React from 'react'
import { connect } from 'react-redux'
import {
  defineMessages,
  InjectedIntlProps,
  injectIntl,
  InjectedIntl
} from 'react-intl'
import { flatten, identity } from 'lodash'

import { Box } from '@opencrvs/components/lib/interface'
import { PrimaryButton, Button } from '@opencrvs/components/lib/buttons'
import { Warning } from '@opencrvs/components/lib/icons'

import styled from 'src/styled-components'

import {
  IFormSection,
  IFormField,
  IForm,
  IFormFieldValue,
  ISelectOption,
  IFileValue,
  SELECT_WITH_OPTIONS,
  IMAGE_UPLOADER_WITH_OPTIONS,
  LIST,
  PARAGRAPH
} from 'src/forms'

import { IDraft } from 'src/drafts'
import { getValidationErrorsForForm } from 'src/forms/validation'
import { goToTab } from 'src/navigation'
import { getRegisterForm } from 'src/forms/register/selectors'
import { IStoreState } from 'src/store'
import { getConditionalActionsForField } from 'src/forms/utils'

const FormAction = styled.div`
  display: flex;
  justify-content: center;
`

const FormPrimaryButton = styled(PrimaryButton)`
  box-shadow: 0 0 13px 0 rgba(0, 0, 0, 0.27);
`

export const messages = defineMessages({
  valueYes: {
    id: 'register.form.valueYes',
    defaultMessage: 'Yes',
    description: 'Label for "Yes" answer'
  },
  valueNo: {
    id: 'register.form.valueNo',
    defaultMessage: 'No',
    description: 'Label for "No" answer'
  },
  submit: {
    id: 'register.form.submit',
    defaultMessage: 'Submit',
    description: 'Submit button'
  },
  informationMissing: {
    id: 'register.form.informationMissing',
    defaultMessage: 'Information missing',
    description: 'Message when a field doesnt have a value'
  },
  missingFieldsDescription: {
    id: 'register.form.missingFieldsDescription',
    defaultMessage: `The following information will be submitted for validation. Please
    make sure all required details have been filled in correctly. There
    are {numberOfErrors} missing mandatory fields in your form:`,
    description:
      'Message shown in the box summarising the missing fields of the form'
  }
})
type DispatchProps = {
  goToTab: typeof goToTab
}
type OwnProps = {
  draft: IDraft
  onSubmit: () => void
}
type Props = {
  registerForm: IForm
}

const PreviewBox = styled(Box)`
  margin-bottom: 30px;
  font-size: 18px;
  font-family: ${({ theme }) => theme.fonts.regularFont};
  color: ${({ theme }) => theme.colors.copy};
`

const PreviewSectionTitle = styled.h2`
  font-family: ${({ theme }) => theme.fonts.lightFont};
  color: ${({ theme }) => theme.colors.copy};
`

const List = styled.ul`
  padding: 0;
`

const ListItem = styled.li`
  display: flex;
  padding-top: 10px;
  padding-bottom: 2px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.background};
`

const ListItemLabel = styled.div`
  flex-basis: 50%;
  font-family: ${({ theme }) => theme.fonts.regularFont};
  color: ${({ theme }) => theme.colors.placeholder};
`
const ListItemValue = styled.div`
  font-family: ${({ theme }) => theme.fonts.regularFont};
  color: ${({ theme }) => theme.colors.copy};
  flex-basis: 50%;
`
const InformationMissingLink = styled(Button)`
  font-family: ${({ theme }) => theme.fonts.regularFont};
  color: ${({ theme }) => theme.colors.danger};
  text-decoration: underline;
  padding: 0;
  text-align: left;
`

const PreviewHeadingBox = styled(PreviewBox)`
  position: relative;
  ${/* sc-sel */ InformationMissingLink} {
    margin-right: 1em;
  }
`

const ErrorDot = styled.div`
  height: 7px;
  width: 7px;
  background-color: ${({ theme }) => theme.colors.error};
  border-radius: 4px;
  display: inline-block;
  vertical-align: 0.65em;
`

const MissingFieldsWarningIcon = styled(Warning)`
  position: absolute;
  top: -16px;
  left: -16px;
`

function renderSelectLabel(
  value: IFormFieldValue,
  options: ISelectOption[],
  intl: InjectedIntl
) {
  const selectedOption = options.find(option => option.value === value)
  return selectedOption ? intl.formatMessage(selectedOption.label) : value
}

function renderFileSubject(files: IFileValue[]) {
  return files.map(file => file.optionValues.join(' ')).join(', ')
}

function renderValue(
  value: IFormFieldValue,
  field: IFormField,
  intl: InjectedIntl
) {
  if (field.type === SELECT_WITH_OPTIONS && field.options) {
    return renderSelectLabel(value, field.options, intl)
  }
  if (typeof value === 'string') {
    return value
  }
  if (typeof value === 'boolean') {
    return value
      ? intl.formatMessage(messages.valueYes)
      : intl.formatMessage(messages.valueNo)
  }
  if (field.type === IMAGE_UPLOADER_WITH_OPTIONS) {
    return renderFileSubject(value as IFileValue[])
  }
  return value
}

class PreviewSectionForm extends React.Component<
  Props & OwnProps & DispatchProps & InjectedIntlProps
> {
  render() {
    const { intl, draft, registerForm } = this.props

    const formSections = registerForm.sections.filter(
      ({ viewType }) => viewType === 'form'
    )

    // REFACTOR
    const emptyFieldsBySection = formSections.reduce(
      (sections, section: IFormSection) => {
        const errors = getValidationErrorsForForm(
          section.fields,
          draft.data[section.id] || {}
        )

        return {
          ...sections,
          [section.id]: section.fields.reduce((fields, field) => {
            // REFACTOR
            const validationErrors = errors[field.name]

            const value = draft.data[section.id]
              ? draft.data[section.id][field.name]
              : null

            const informationMissing =
              validationErrors.length > 0 || value === null

            return { ...fields, [field.name]: informationMissing }
          }, {})
        }
      },
      {}
    )

    const numberOfErrors = flatten(
      Object.values(emptyFieldsBySection).map(Object.values)
    ).filter(identity).length

    const sectionsWithErrors = formSections.filter(section =>
      Object.values(emptyFieldsBySection[section.id]).some(identity)
    )

    const isVisibleField = (field: IFormField, section: IFormSection) => {
      const conditionalActions = getConditionalActionsForField(
        field,
        draft.data[section.id] || {}
      )
      return !conditionalActions.includes('hide')
    }

    const isViewOnly = (field: IFormField) => {
      return [LIST, PARAGRAPH].find(type => type === field.type)
    }

    return (
      <>
        {numberOfErrors > 0 && (
          <PreviewHeadingBox>
            <MissingFieldsWarningIcon />
            {intl.formatMessage(messages.missingFieldsDescription, {
              numberOfErrors
            })}
            <br />
            <br />
            {sectionsWithErrors.map((section: IFormSection) => {
              const emptyFields = Object.entries(
                emptyFieldsBySection[section.id]
              )
                .filter(([, empty]) => empty)
                .map(([id]) =>
                  section.fields.find(field => id === field.name)
                ) as IFormField[]

              return (
                <div key={section.id}>
                  <strong>{intl.formatMessage(section.title)}</strong>
                  <br />
                  {emptyFields.map(({ label, name }) => (
                    <InformationMissingLink
                      key={name}
                      onClick={() =>
                        this.props.goToTab(draft.id, section.id, name)
                      }
                    >
                      {intl.formatMessage(label)}
                    </InformationMissingLink>
                  ))}
                  <br />
                  <br />
                </div>
              )
            })}
          </PreviewHeadingBox>
        )}
        {formSections.map((section: IFormSection, i) => {
          return (
            <PreviewBox key={section.id}>
              <PreviewSectionTitle>
                {intl.formatMessage(section.title)} <ErrorDot />
              </PreviewSectionTitle>
              <List>
                {section.fields
                  .filter(
                    field =>
                      isVisibleField(field, section) && !isViewOnly(field)
                  )
                  .map((field: IFormField) => {
                    const informationMissing =
                      emptyFieldsBySection[section.id][field.name]

                    return (
                      <ListItem
                        id={`listItem_${section.id}_${field.name}`}
                        key={field.name}
                      >
                        <ListItemLabel>
                          {intl.formatMessage(field.label)}
                        </ListItemLabel>
                        <ListItemValue
                          id={`listItem_value_${section.id}_${field.name}`}
                        >
                          {informationMissing ? (
                            <InformationMissingLink
                              onClick={() =>
                                this.props.goToTab(
                                  draft.id,
                                  section.id,
                                  field.name
                                )
                              }
                            >
                              {intl.formatMessage(messages.informationMissing)}
                            </InformationMissingLink>
                          ) : (
                            renderValue(
                              draft.data[section.id][field.name],
                              field,
                              intl
                            )
                          )}
                        </ListItemValue>
                      </ListItem>
                    )
                  })}
              </List>

              {i === formSections.length - 1 && (
                <FormAction>
                  <FormPrimaryButton
                    onClick={this.props.onSubmit}
                    id="submit_form"
                    disabled={numberOfErrors > 0}
                  >
                    {intl.formatMessage(messages.submit)}
                  </FormPrimaryButton>
                </FormAction>
              )}
            </PreviewBox>
          )
        })}
      </>
    )
  }
}

export const PreviewSection = connect<Props, DispatchProps, OwnProps>(
  (state: IStoreState, { draft, onSubmit }: OwnProps) => ({
    onSubmit,
    draft,
    language: state.i18n.language,
    registerForm: getRegisterForm(state)
  }),
  {
    goToTab
  }
)(injectIntl(PreviewSectionForm))