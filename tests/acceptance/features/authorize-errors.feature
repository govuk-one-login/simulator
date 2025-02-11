@modifiesClientConfig
Feature: Authorize errors
  Background:
    Given the simulator is sent the configuration
    Given the simulator is configured with the client ID "gjWNvoLYietMjeaOE6Zoww533u18ZUfr"

  Scenario: Missing query params
    When a request is made with no query params
    Then a matching response is returned

  Scenario: Unknown prompt
    When a request is made with an unknown prompt
    Then a matching response is returned

  Scenario: Unknown prompt and missing redirect URI
    When a request is made with an unknown prompt and no redirect uri
    Then a matching response is returned

  Scenario: Missing redirect URI
    When a request is made without a redirect uri
    Then a matching response is returned

  Scenario: Badly formatted redirect URI
    When a request is made with a badly formatted redirect uri
    Then a matching response is returned

  Scenario: Incorrect redirect URI
    When a request is made with an incorrect redirect uri
    Then a matching response is returned

  Scenario: Unknown client_id
    When a request is made with an unknown client_id
    Then a matching response is returned

  Scenario: Missing scope
    When a request is made without a scope
    Then a matching response is returned

  Scenario: Malformed claims
    When a request is made with malformed claims
    Then a matching response is returned

  Scenario: Request URI
    When a request is made with a request uri
    Then a matching response is returned

  Scenario: Incorrect response type
    When a request is made with an incorrect response type
    Then a matching response is returned

  Scenario: Unknown scope
    When a request is made with an unknown scope
    Then a matching response is returned

  Scenario: Unknown claim
    When a request is made with an unknown claim
    Then a matching response is returned

  Scenario: Missing nonce
    When a request is made without a nonce
    Then a matching response is returned

  Scenario: Invalid VTR
    When a request is made with an invalid VTR
    Then a matching response is returned
