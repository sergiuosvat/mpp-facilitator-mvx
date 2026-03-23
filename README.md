# MPP Facilitator (MultiversX)

A high-performance facilitator microservice for the **Mobile Payment Protocol (MPP)** integration on **MultiversX**. It manages payment challenges, verifies on-chain transactions, and provides an OpenAPI-compliant discovery endpoint.

## Features

- **Transaction Verification**: Robust parsing and validation of EGLD and ESDT transfers.
- **Multi-Transfer Support**: Correctly handles `MultiTransferESDT` and `MultiESDTNFTTransfer` formats.
- **Advanced Compliance**: Support for `opaque` data, `digest` body binding, and `source` identification.
- **Service Discovery**: Automated OpenAPI 3.1.0 generation with `x-service-info` and `x-payment-info` extensions.
- **Security**: HMAC-SHA256 bound challenge IDs, rate limiting, and TTL-based challenge expiration.
- **Production Ready**: Full test coverage and environment-driven configuration.

## Configuration

The service is configured via environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Listening port for the application | `3000` |
| `MPP_SECRET_KEY` | **Required**. Secret key for signing challenge IDs | N/A |
| `MPP_DEFAULT_CURRENCY` | Default token ticker (e.g., EGLD, WEGLD-abd123) | `EGLD` |
| `MPP_CHAIN_ID` | MultiversX Chain ID (D=Devnet, T=Testnet, 1=Mainnet) | `D` |
| `MPP_TOKEN_DECIMALS` | Decimals for the payment token | `18` |
| `MPP_REALM` | Service identifier for the WWW-Authenticate header | `agentic-payments-mvx` |
| `MPP_RELAY_RATE_LIMIT` | Max requests per window for relayed calls | `100` |

## Discovery Endpoint

The service automatically serves payment metadata via:
- `GET /openapi.json`

This file is used by AI agents to understand how to pay for services using MPP.

## License

MIT
