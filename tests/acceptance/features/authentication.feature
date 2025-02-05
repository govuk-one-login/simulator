Feature: Authentication
  Scenario: User successfully login
    Given the user comes from the stub relying party with default options
    Then the user is taken to the "Create your GOV.UK One Login or sign in" page
    When the user selects sign in
    Then the user is taken to the "Enter your email" page
    When user enters "TEST_USER_EMAIL" email address
    Then the user is taken to the "Enter your password" page
    When the user enters their password
    Then the user is taken to the "Check your phone" page
    When the user enters the six digit security code from their phone
    Then the user is returned to the service
    And the RP receives the expected auth-only user info
    And the user logs out
    When the simulator is sent the configuration
    Then the simulator returns the expected auth-only user info
