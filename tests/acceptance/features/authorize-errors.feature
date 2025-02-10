Feature: Authorize errors
  Scenario: Missing query params
    When a request is made with no query params
    Then a matching response is returned

  Scenario: Non-OIDC request
    Given the simulator is sent the configuration
    When a request is made without the oidc scope
    Then a matching response is returned
