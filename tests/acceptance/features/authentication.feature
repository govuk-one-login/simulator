Feature: Authentication
  Scenario: User successfully login
    Given the user comes from the micro RP with default options
    Then the user is taken to the "Create your GOV.UK One Login or sign in" page
    When the user selects sign in
    Then the user is taken to the "Enter your email" page
    When user enters "TEST_USER_EMAIL" email address
    Then the user is taken to the "Enter your password" page
    When the user enters their password
    Then the user is taken to the "Enter the 6 digit security code shown in your authenticator app" page
    When the user enters the six digit security code from their authenticator app
    Then the user is returned to the service
    And the RP receives a valid ID Token
    And the RP receives the expected auth-only user info
    And the user logs out
    When the simulator is sent the configuration
    Given the user comes from the micro RP with options: "simulator-idp"
    Then the user is returned to the service
    And the RP receives a valid ID Token from the simulator
    And the RP receives the expected auth-only user info
    And the user logs out

