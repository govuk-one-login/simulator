Feature: Identity
  Scenario: User successfully gets identity response
    Given the user comes from the micro RP with options: "loc-P2"
    Then the user is taken to the "Create your GOV.UK One Login or sign in" page
    When the user selects sign in
    Then the user is taken to the "Enter your email" page
    When user enters "TEST_USER_EMAIL" email address
    Then the user is taken to the "Enter your password" page
    When the user enters their password
    Then the user is taken to the "Enter the 6 digit security code shown in your authenticator app" page
    When the user enters the six digit security code from their authenticator app
    Then the user is taken to the "You have already proved your identity" page
    When the user clicks the "Continue to the service" button
    Then the user is returned to the service with extended timeout
    And the RP receives a valid ID Token
    And the RP receives the expected identity user info
    And the RP receives a valid CoreIdentityJWT
    And the user logs out
    When the simulator is sent the identity configuration
    Given the user comes from the micro RP with options: "loc-P2,simulator-idp"
    Then the user is returned to the service
    And the RP receives a valid ID Token from the simulator
    And the RP receives the expected identity user info
    And the RP receives a valid CoreIdentityJWT from the simulator
    And the user logs out
