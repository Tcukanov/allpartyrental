
NYC KIDS PARTY ENTERTAINMENT - Integration Guide
PayPal
+ NYC KIDS PARTY ENTERTAINMENT
Integration Guide
PayPal Complete Payments
Table of Contents
1. Introduction
a. Account Setup
b. Getting Started with PayPal APIs
2. Onboarding
a. Overview
b. Onboard Sellers Before Payment
c. ACDC Readiness
d. Testing in Sandbox
e. Best Practices
3. Payments
a. The PayPal JS SDK
b. PayPal REST APIs
c. Reverse Money Movement
4. Payment Methods
a. PayPal
b. Venmo
c. Pay Later
d. Card Fields
e. Apple Pay
f. Google Pay
5. Reporting
a. Overview
b. Available Reports
6. Best Practices
a. Logging
b. Outages
c. Monitoring
Introduction
This document serves as the integration specification for NYC KIDS PARTY ENTERTAINMENT to design and develop for the PayPal
Complete Payments integration with PayPal. It expands on the Solution Proposal, which was previously delivered by PayPal to NYC KIDS
PARTY ENTERTAINMENT.

PayPal will become the payment provider for NYC KIDS PARTY ENTERTAINMENT’s platform. NYC KIDS PARTY ENTERTAINMENT will utilize
the PayPal Complete Payments product suite to onboard sellers and collect payments. PayPal Complete Payments (PPCP) offers
multiparty payment processing solutions for marketplaces and platforms. With these solutions, you can onboard global sellers by applying
local regulations and compliance rules.

PayPal Complete Payments overview
Account Setup
To develop a sandbox API integration, you must create a sandbox PayPal account with a partner/platform REST app to serve as the API-
caller account. Steps to create and configure sandbox and live REST apps are available online:

Create your sandbox API-caller account
Create a platform REST app in your sandbox account
Get your sandbox API credentials
Create your live API-caller account
Create a REST app in your live account
Get your live API credentials
Once you have created the accounts, please share your sandbox and live client IDs and email addresses with your integration engineer(s).

Getting Started with PayPal APIs
To make REST API calls in your integration, your integration must first exchange your client ID and client secret for an OAuth access token.

Sample cURL "get access token" request
BN code
A Build Notation (BN) code is an identifier used to associate API calls with a PayPal partner. BN codes provide tracking on all transactions
that originate from or are associated with a particular partner. NYC KIDS PARTY ENTERTAINMENT is required to include their BN code in two
places:

In "create order" requests under the PayPal-Partner-Attribution-Id HTTP header (docs) and
In the PayPal JS SDK's <script> tag under the data-partner-attribution-id attribute (docs).
The BN code for your integration is "NYCKIDSPARTYENT_SP_PPCP".

Auth Assertion Header
NYC KIDS PARTY ENTERTAINMENT should pass an API client-provided JSON Web Token (JWT) assertion that identifies the merchant. To
use this header, you must get consent to act on behalf of a merchant.

Instead of managing multiple access tokens, you can use this header to provide a JWT assertion that identifies the merchant when you call
the API.

PayPal-Auth-Assertion header
Onboarding
Overview
NYC KIDS PARTY ENTERTAINMENT’s sellers must complete onboarding to accept PayPal payments on your platform. During onboarding,
sellers will go through all the steps necessary to provision their PayPal account and grant NYC KIDS PARTY ENTERTAINMENT permission to
act on their behalf. The necessary fields in the onboarding flow are API-assisted, allowing you to prefill the fields with any information
already collected from your sellers.

Onboarding Overview
Onboard Sellers Before Payment
NYC KIDS PARTY ENTERTAINMENT will connect sellers with PayPal before they accept PayPal payments from buyers on your platform.

PayPal should be presented as the first, preferred option amongst supported payment providers for NYC KIDS PARTY ENTERTAINMENT.

Seller onboarding checklist
How it works
Before you code
PayPal should be presented as the first, preferred option amongst supported payment providers for NYC KIDS PARTY ENTERTAINMENT.

Steps
1. Set up Webhooks
Webhooks Overview
2. Generate a signup link
Pass features and capabilities in the "create partner referral" request
3. Add signup link to your site
4. Redirect seller to a return URL
5. Track seller onboarding status
Before processing transactions, and periodically thereafter, NYC KIDS PARTY ENTERTAINMENT should check the seller's status, via the
Show Seller Status API, and ensure that in the response:

Check the PRIMARY_EMAIL_CONFIRMED flag. If this flag is false:
Inform the seller that they need to confirm their primary email address with PayPal before they can receive payments, e.g., "Please
confirm your email address on paypal.com in order to receive payments! You currently cannot receive payments. Once done, simply
revisit this page to refresh the onboarding status."
Keep PayPal payments turned off until this is resolved.
Note that PayPal does not let sellers change their primary email address unless the new email address has been confirmed.
Therefore, once this flag becomes true, it will always remain true.
Check the PAYMENTS_RECEIVABLE flag. If this flag is false:
Inform the seller that there is an issue with their PayPal account that needs to be resolved before they can accept payments, e.g., "You
currently cannot receive payments due to possible restriction on your PayPal account. Please reach out to PayPal Customer Support
or connect to paypal.com for more information. Once sorted, simply revisit this page to refresh the onboarding status".
Direct them to contact PayPal for more information.
Keep PayPal payments turned off until this is resolved.
Check the OAUTH_INTEGRATIONS array. If this array is empty:
Inform the seller that there is an issue with their onboarding with PayPal.
Direct them to go through the onboarding flow again and grant third party permissions to NYC KIDS PARTY ENTERTAINMENT.
Keep PayPal payments turned off until this is resolved.
After a seller has onboarded, enable each of the supported payment methods that their PayPal account is approved for. Offer sellers a
dashboard to view their account status and customize their payments, including

A success message when the account is properly provisioned and ready to transact.
An error message when there is an issue with their account.
PayPal Checkout buttons should appear on product detail pages, cart pages, and payment pages by default.
A button to unlink the onboarded PayPal account, so that a seller can either cease processing or link another PayPal account.
NYC KIDS PARTY ENTERTAINMENT cannot formally revoke the permissions granted to them by the seller during onboarding. However,
when a seller requests that you unlink their account from yours, your integration should "forget" which PayPal account they have
associated with so that they may link another.
ACDC Readiness
Before enabling Advanced Card Processing for a seller, ensure via the Show Seller Status API that the seller is enabled for these features by
checking the criteria below:

Check for PPCP_CUSTOM object in products array and ensure that
The VETTING_STATUS is "SUBSCRIBED".
If the VETTING_STATUS is "DENIED", enable the seller for PayPal Payment Buttons; however, do not enable them for Advanced Card
Processing.
For other VETTING_STATUS, enable the seller for PayPal Payment Buttons, then wait for a CUSTOMER.MERCHANT-
INTEGRATION.PRODUCT-SUBSCRIPTION-UPDATED webhook event. Once received, use the "show seller status" API and check the
VETTING_STATUS of the PPCP_CUSTOM product.
Check CUSTOM_CARD_PROCESSING object in the capabilities array and ensure that:
The status is "ACTIVE".
There are no limits property in the object.
Testing in Sandbox
When you create a test account through the PayPal Developer Dashboard, PayPal automatically marks the email address on the test
account as "confirmed". However, when an account is created through the onboarding flow, the email address on the test account must be
confirmed manually. Since the PayPal Sandbox does not send real emails, you will need to take some extra steps to confirm the email
address on the account.

First, you will need to link the new test account to your PayPal developer account by following the steps below:

1. In the PayPal Developer Dashboard, navigate the Sandbox test accounts page.
2. Click the Link other Sandbox accounts to this developer account link and log in with your PayPal developer account.
3. Log in using the email and password associated with the sandbox account.
4. Click the Agree and Connect button.
Next, you will need to trigger the confirmation email from within your test account:

1. Log in to your test account at sandbox.paypal.com.
2. Navigate to the Email settings page under Profile settings > Personal information > Update and click the Confirm link.
Finally, you will need to locate the confirmation email in your PayPal Developer Dashboard and click the link in it to confirm the email
address.

1. Log in to the PayPal Develop Dashboard with your PayPal Developer account.
2. Navigate to the Sandbox email notifications page under Testing Tools > Sandbox Notifications.
3. Select the email address for the sandbox account under "Test Account Email" and click the Search button.
4. Click the email row with the subject "Please activate your account".
5. Click on Click here to activate your account link in the email and then log in to confirm the email address.
Best Practices
1. Show the email address of the seller's PayPal account to the seller.
2. Share the seller's account data with PayPal in your "create partner referral" request.
3. Always provide a unique tracking_id with each "create partner referral" request.
4. Do not share action URLs with multiple sellers.
5. Periodically re-check the seller's details to find out if anything has changed.
6. Subscribe to the MERCHANT.PARTNER-CONSENT.REVOKED webhook event to be notified when a seller revokes API permissions from you.
Payments
PayPal will provide transactional services to NYC KIDS PARTY ENTERTAINMENT's platform in a white label fashion. For PayPal Wallet
payments, the buyer will know that PayPal is processing the transaction as they are utilizing their PayPal Wallet for the transaction. The
Seller will know that PayPal is processing payments and will receive funds from a PayPal Wallet transaction.

This section describes the basics of basics of integrating with the PayPal JS SDK, REST APIs, and forward and reverse money movement in
detail. NYC KIDS PARTY ENTERTAINMENT's integration uses PayPal's latest JS SDK that gives consumers a simplified and secure checkout
experience. With the JS SDK, NYC KIDS PARTY ENTERTAINMENT can automatically present the most relevant payment options with limited
integration effort.

How it works
The PayPal JS SDK
This integration uses PayPal's JavaScript (JS) SDK to display relevant payment methods on your sellers' pages with options to personalize
and streamline their checkout experience.

Steps
1. Add the SDK
2. Configure and customize your integration
Query parameters
Script parameters
Pass commit=true in the JS SDK configuration to ensure buyers see a "Pay Now" button in PayPal Checkout. The "Pay Now" experience
allows the payment to be completed on the PayPal review page, without the need to first return to the original payment page.

Complete JavaScript SDK reference
Performance optimization loading JavaScript SDK and rendering payment buttons for the best performance.
Payment Currencies
NYC KIDS PARTY ENTERTAINMENT will present and settle in USD in US. For other currencies, set the currency parameter in the JS SDK's
configuration.

Order Intent
NYC KIDS PARTY ENTERTAINMENT can determine whether the funds are captured immediately or at some later point through the intent
parameter of the JS SDK's configuration.

PayPal REST APIs
This integration will use PayPal REST APIs to authenticate with OAuth 2.0 and return HTTP response codes and responses encoded in
JSON.

Get started with PayPal REST APIs
Authentication
Postman Guide
API requests
API responses
To process payments, this integration will use the Orders V2 API for all payment methods. Please follow the links listed below for creating
and managing orders/payments:

Pass line-item details in purchase_units[].items
Pass name of items the buyers are purchasing in purchase_units[].items[].name
Manage created Payments
List of Orders v2 Errors
Test Credit Card Generator
Negative testing on Sandbox
Soft Descriptor
PayPal uses the following logic for determining the Soft Descriptor that may show up on the consumer's statement or transaction history on
issuer statements and customer portals:

PAYPAL_prefix+(space)+merchant_descriptor+(space)+ soft_descriptor
Soft descriptors are limited to 22 characters and will be trimmed, as necessary.

NYC KIDS PARTY ENTERTAINMENT can specify the SOFT_DESCRIPTOR at transaction time in the Create Order API.

Payment Type Soft Descriptor Example
Visa, Mastercard, Discover cards <SOFT_DESCRIPTOR> Merchant
American Express cards PP *<SOFT_DESCRIPTOR> PP *Merchant
PayPal Wallet PAYPAL *<SOFT_DESCRIPTOR> PAYPAL *Merchant
Partner Fee
Partner Fee enables NYC KIDS PARTY ENTERTAINMENT to charge commissions, or brokerage fees for each transaction they facilitate on
behalf of a seller. The seller will see the platform Fee in their transaction details as "Partner commissions".

The currency of the platform fee must be the same as the currency on the transaction.
The platform Fee payee needs to have a bank account added to their PayPal account to receive the funds.
Partner fees are settled into the bank account attached to the NYC KIDS PARTY ENTERTAINMENT account. This settlement is done once
daily, so transactions with Partner fees that are completed today will be consolidated into one payment and settled tomorrow.
If a NYC KIDS PARTY ENTERTAINMENT elects to receive Partner fees from their integration, their Partner/API-caller account will be
unable to hold a non-zero balance. Partner fees will instead be disbursed directly into the bank account associated with the NYC KIDS
PARTY ENTERTAINMENT account. This can cause problems if the PayPal account has an existing balance or if they're using it to receive
funds for other things.
Platform fee is NOT supported for First-party integrations.
In case of intent: "CAPTURE", specify the fee during order creation through the
purchase_units[].payment_instruction.platform_fees array.
In case of intent: "AUTHORIZE", specify the fee during authorization capture through the payment_instruction.platform_fees
array.
If purchase_units[].payment_instruction.platform_fees[].payee is not set, the fee amount will go to the API caller account.
During transaction refunds, NYC KIDS PARTY ENTERTAINMENT may specify the amount of partner fees to refund. NYC KIDS PARTY
ENTERTAINMENT must be enabled by PayPal to use this feature.
Reverse Money Movement
PayPal will support reversal (refunds) processing initiated by NYC KIDS PARTY ENTERTAINMENT, reversals initiated by PayPal (reversals),
and reversals initiated by the consumer at PayPal.com (disputes). PayPal will support the following reversal scenarios, refunds, reversals,
and disputes.

Refunds
PayPal supports refunds initiated via API by NYC KIDS PARTY ENTERTAINMENT or through PayPal dashboard by Merchant.

Issue a Refund
Payment Methods
PayPal
This integration allows NYC KIDS PARTY ENTERTAINMENT to render PayPal buttons to process payment through buyer’s PayPal Wallet.

Present PayPal Checkout buttons upstream, including on the product detail page and cart page, for orders that do not require shipping or
updates to shipping, like digital goods.

Add payment buttons
Create Order with PayPal as payment source.
Test purchases
Customize the checkout experience
One-Time Payments
Pay with PayPal's one-time payment flow provides a one-click solution to accelerate your buyer's checkout experience by skipping manual
data entry.

Use one-time payments for all buyer-present PayPal transactions.
One-Time Payments
App Switch

App Switch lets PayPal customers start a transaction in a browser or app and finish it in the PayPal app, simplifying checkout with strong
multi-factor authentication. Buyers can log in using biometrics or a passkey instead of a password. If App Switch isn't available, the
process defaults to the web flow.

App Switch
Buyer Identifiers

Include the buyer’s email address as the identifier in the Create Order request to PayPal. This allows PayPal to prefill the login page during
one-time checkout, speeding up the authentication process for a smoother login experience.

Pass a buyer identifier to streamline buyer login
Venmo
This integration allows NYC KIDS PARTY ENTERTAINMENT (when eligible) to render Venmo button to process payment through buyer’s
Venmo account. Add script tag enable-funding=venmo to enable Venmo.

What is Venmo?
How to integrate Venmo?
Venmo Checkout – Best Practices
Testing
Currently you can only test Venmo eligibility via the Sandbox environment. Unfortunately, end-to-end Venmo testing is not fully
available in Sandbox yet.
Buyers will not see the Venmo button rendered as a payment method if the IP address is not within the US.
For development teams outside of the US, the Venmo integration can be tested by overriding buyer-country in the JS SDK (only in
Sandbox).
Pay Later
This integration allows NYC KIDS PARTY ENTERTAINMENT to render Pay Later button to process payment through PayPal financing. Add
script tag enable-funding=paylater to enable Pay Later.

What is Pay Later?
Card Fields
This integration allows NYC KIDS PARTY ENTERTAINMENT to render both PayPal buttons and custom credit and debit card fields within the
same page. Configure the JS SDK with components=buttons,card-fields to display card fields.

PayPal Expanded Checkout
How to integrate Expanded Checkout through card fields
Customizing Expanded Checkout
Apple Pay
This integration allows NYC KIDS PARTY ENTERTAINMENT to render Apple Pay buttons to process payment through buyer’s Apple wallet.

What is Apple Pay?
Domain registration
Integrate Apple Pay checkout
Set up Apple Pay Button
Create Apple Pay session
Show the payment sheet
Test your integration
Steps
1. Before you start integration, modify your "create partner referral" call to include
“PAYMENT_METHODS” in the products array and
“APPLE_PAY” in the the CAPABILITIES array.
2. Add applepay to the components list passed when configuring the PayPal JS SDK.
Google Pay
This integration allows NYC KIDS PARTY ENTERTAINMENT to render Google Pay buttons to process payment through buyer’s Google
wallet.

What is Google Pay?
Integrate Google Pay checkout
Set up your Google Pay button
Create PaymentDataRequest
Sample Google Pay integration
Test Your Integration
Steps
1. Before you start integration, modify your "create partner referral" calls to include
“PAYMENT_METHODS” in the products array and
“GOOGLE_PAY” in the capabilities array.
2. Add googlepay to the components list passed when configuring the PayPal JS SDK.
Reporting
Overview
PayPal reports provide transaction level detail to better manage the back-end operations including reconciliation and disputes
management.

Overview of Reporting
Step by step instructions to set up SFTP account
Available Reports
Payouts Reconciliation Report
Provides a listing of all transactions that occurred on all sellers during the previous day. Enables you to reconcile the end-to-end
money flow of the transactions.
Marketplaces Case Reconciliation Report
Shows details for case management processes, including details for cases that were opened or closed during the reporting time
frame.
Financial Detail Report
Provides a detailed view of the activity on an individual NYC KIDS PARTY ENTERTAINMENT's financial account.
Financial Summary Report
This (monthly) report provides a summary of the activity on a NYC KIDS PARTY ENTERTAINMENT's financial accounts.
Decline Analysis Report
Analyzing your declined transactions can help you spot fraud early and make sure you are getting the most you can from
your business.
Partner Balance Report
This report assists in reconciling daily revenue and activities within the partner fee financial account.
Disbursement Report
This report is for partners who have automated fund settlements to their bank accounts. It helps reconcile the settled amounts
with the partner fee transactions and is primarily used for bank deposit reconciliation.
Best Practices
Logging
NYC KIDS PARTY ENTERTAINMENT shall log all PayPal API calls with their requests and responses. The proposed retention time is 1-
months. Please follow all PCI rules to ensure not to log PII data.

PayPal will return a "debug ID" in each API response through either the debug_id parameter or the paypal-debug-id header. It is
important that these are logged to efficiently find transactions on PayPal records. Note that the returned values paypal-debug-id,
debug_id and correlation-id are the same.

Outages
Subscribe to PayPal's outage notifications on paypal-status.com to be informed about upcoming maintenance and irregular outages.

Monitoring
Monitor PayPal API traffic and check for failed API calls or unexpected times of silence, e.g., an hour of no API calls, which might indicate a
more systemic issue.

This is a offline tool, your data stays locally and is not send to any server!
Feedback & Bug Reports