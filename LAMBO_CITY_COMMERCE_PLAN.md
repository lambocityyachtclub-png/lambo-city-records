# LAMBO CITY COMMERCE — Product & Development Plan

**Status:** Strategic direction approved; no live selling or payment integration authorized yet
**Role in the ecosystem:** Direct\-to\-consumer business channel

## Vision

LAMBO CITY should be able to sell and distribute its own products through business channels it controls, without making the game engine itself responsible for commerce\.

## Potential offerings

- Music and music\-related releases\.
- Physical merchandise\.
- Digital products and downloadable creative content\.
- Future creator or event\-related offerings, subject to business review\.

## Functional areas to plan for

- Product catalog and product details\.
- Product availability and pricing\.
- Cart and checkout experience\.
- Order confirmation and order history\.
- Fulfillment and delivery status for physical goods\.
- Secure delivery/access for digital products\.
- Refund, cancellation, customer support, and applicable tax workflows\.
- Business reporting and exportable records\.

## Architecture boundaries

- Commerce must be a separate module from the 3D game and Studio\.
- The website can link to commerce experiences without putting payment code into the game engine\.
- Payment credentials and sensitive customer data must be handled by a suitable payment provider; never store raw card data in the game or repository\.
- Use provider\-hosted checkout or another appropriately secured integration when the time comes\.
- Keep product/catalog data portable so the business is not unnecessarily locked to one vendor\.
- Test with mock products and sandbox transactions before any real payments\.

## Phased roadmap

1. **Planning now:** Define product categories, customer journey, fulfillment needs, and ownership of the storefront\.
2. **Later foundation:** Build a catalog and storefront prototype using mock data only\.
3. **Before launch:** Select a payment provider, review fees and terms, configure tax/refund/fulfillment processes, and complete security testing\.
4. **Launch:** Enable real payments only after explicit approval and operational readiness\.

## Commercial and hosting rule

Separating commerce code from the game is good architecture, but it does not automatically exempt a commercially operated deployment from its hosting provider’s terms\. Review the terms of each hosting, payment, and distribution service before commercial launch\. This is a provider\-compliance issue—not a restriction on developing commercial features or owning the business\.

## Non\-goals for the current phase

- No live checkout or payment credentials\.
- No real customer accounts or order database\.
- No paid service activation or new spending without approval\.
- No assumption that a specific payment provider has been selected\.
