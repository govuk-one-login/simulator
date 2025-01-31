Feature: Identity
  Scenario: User successfully gets identity response
    Given the user comes from the stub relying party with options: "loc-P2,claims-core-identity"
    Then the user is taken to the "Create your GOV.UK One Login or sign in" page
    When the user selects sign in
    Then the user is taken to the "Enter your email" page
    When user enters "TEST_USER_EMAIL" email address
    Then the user is taken to the "Enter your password" page
    When the user enters their password
    Then the user is taken to the "Check your phone" page
    When the user enters the six digit security code from their phone
    Then the user is taken to the "IPV Stub Form" page
    When the user clicks the continue button
    Then the user is returned to the service with extended timeout
    And the RP receives the expected identity user info
    And the user logs out
    When the simulator is sent the identity configuration
    Then the simulator returns the expected identity user info
