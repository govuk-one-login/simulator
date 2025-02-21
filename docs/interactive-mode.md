### Running the simulator in interactive mode:

By default the simulator is set to run with no UI and the response configuration is returned in all `/userinfo` requests until updated.

However it is possible to run simulator to return multiple response configurations. This is done by setting the environment variable `INTERACTIVE_MODE` to `true` which will render a form after each `/authorize` request to collect the expected response configuration.

Each configurable response field has a `data-testid` attribute which may be useful when matching DOM elements in a browser driven test framework, these are outlined below:

| Field                             | `data-testid` attribute    |
| --------------------------------- | -------------------------- |
| sub                               | `"sub"`                    |
| email                             | `"email"`                  |
| emailVerified                     | `"email-verified"`         |
| phoneNumber                       | `"phone-number"`           |
| phoneNumberVerified               | `"phone-number-verified"`  |
| maxLoCAchieved                    | `"max-loc-achieved"`       |
| coreIdentityVerifiableCredentials | `"core-identity-vc"`       |
| passportDetails                   | `"passport-details"`       |
| drivingPermitDetails              | `"driving-permit-details"` |
| postalAddressDetails              | `"postal-address-details"` |
| returnCodes                       | `"return-codes"`           |

Once interactive mode is enabled, after you make the `/authorize` request a form will displayed, asking you to input the expected response configuration.

> [!NOTE]  
> The form will display all possible configurable fields, even if you're authorize request doesn't include the scope or claims required for the simulator to return them.
> For example, your authorize request might not include the `https://vocab.account.gov.uk/v1/passport` claim but the form will still include this field. The simulator will only return the scopes or claims included in `/authorize` request

By default the form will be pre-populated with the [response configuration](./configuration.md#response-configuration) the simulator is configured with. However the fields can be overwritten with the expected values for each response configuration field.

You can find example JSON for identity claims in the [technical documentation](https://docs.sign-in.service.gov.uk/integrate-with-integration-environment/prove-users-identity/#prove-your-user-39-s-identity) or in the [onboarding examples](https://github.com/govuk-one-login/onboarding-examples).

The submitted form values are validated to the same level of validation as values submitted at the `/config` endpoint, which is outlined [here](./configuration.md#response-configuration)

Once you've inputted the form information, press continue to be redirected to the `redirect_uri` in the `/authorize` request.

When you exchange the issued `access_token` at the `/userinfo` endpoint, you will be returned the response configuration that you submitted in the form.

If some response configuration form fields are not submitted, they will fallback to using the [configured response fields](./configuration.md#response-configuration).

Some fields **must** be submitted as part of the response configuration form, these fields are:

- Sub

If you submit an invalid field, you may be presented with the following error response:

```json
{
  "error": "invalid_request",
  "invalid_fields": [
    {
      "field": "a field name",
      "msg": "an error message"
    }
  ]
}
```
