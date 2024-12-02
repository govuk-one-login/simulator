Feature: Authentication
  Scenario: User successfully login without 2FA
    Given the user comes from the stub relying party with options: "2fa-off"
    Then the user is taken to the "Create your GOV.UK One Login or sign in" page
    When the user selects sign in
    Then the user is taken to the "Enter your email" page
    When user enters "TEST_USER_EMAIL" email address
    Then the user is taken to the "Enter your password" page
    When the user enters their password
    Then the user is returned to the service
    And the RP receives the expected user info
    And the user logs out
    When the simulator is sent the configuration
    Then the simulator returns the expected user info
