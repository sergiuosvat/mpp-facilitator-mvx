import { Controller, Get, Res } from '@nestjs/common';
import type { Response as ExpressResponse } from 'express';

/**
 * MPP Discovery Endpoint
 *
 * Implements the Payment Discovery Extension (draft-payment-discovery-00).
 * Serves an OpenAPI 3.1.0 document with x-service-info and x-payment-info extensions
 * to enable AI agents and clients to discover payment capabilities.
 */
@Controller()
export class DiscoveryController {
  @Get('openapi.json')
  getOpenApiSpec(@Res() res: ExpressResponse) {
    const currency = process.env.MPP_DEFAULT_CURRENCY || 'EGLD';
    const chainId = process.env.MPP_CHAIN_ID || 'D';
    const realm = process.env.MPP_REALM || 'agentic-payments-mvx';
    const baseUrl = process.env.MPP_BASE_URL || 'http://localhost:3000';

    const openApiSpec = {
      openapi: '3.1.0',
      info: {
        title: 'MPP Facilitator MultiversX',
        version: '1.0.0',
        description:
          'Machine Payments Protocol facilitator for MultiversX blockchain. Supports EGLD and ESDT token payments via the MPP charge intent.',
        'x-service-info': {
          realm,
          categories: ['blockchain', 'payments', 'multiversx'],
          documentation: 'https://mpp.dev',
          supportedMethods: ['multiversx'],
          supportedIntents: ['charge'],
          termsOfService: `${baseUrl}/terms`,
        },
      },
      servers: [
        {
          url: baseUrl,
          description: 'MPP Facilitator Server',
        },
      ],
      paths: {
        '/protected-resource': {
          get: {
            operationId: 'getProtectedResource',
            summary: 'Access a protected resource requiring MPP payment',
            description:
              'Returns the protected resource content. Requires a valid MPP Payment credential in the Authorization header.',
            'x-payment-info': {
              intent: 'charge',
              method: 'multiversx',
              defaultCurrency: currency,
              defaultChainId: chainId,
              description: 'One-time payment to access the protected resource',
              paymentFlow: 'data-payload-tagging',
            },
            parameters: [
              {
                name: 'amount',
                in: 'query',
                required: false,
                schema: { type: 'string' },
                description: 'Override the payment amount (in smallest unit)',
              },
            ],
            responses: {
              '200': {
                description:
                  'Successful response — resource content delivered with Payment-Receipt header',
                headers: {
                  'Payment-Receipt': {
                    schema: { type: 'string' },
                    description: 'Base64-encoded payment receipt',
                  },
                },
                content: {
                  'text/plain': {
                    schema: { type: 'string' },
                  },
                },
              },
              '402': {
                description:
                  'Payment Required — returns a WWW-Authenticate challenge',
                headers: {
                  'WWW-Authenticate': {
                    schema: { type: 'string' },
                    description:
                      'Payment challenge in the Payment authentication scheme',
                  },
                  'Cache-Control': {
                    schema: { type: 'string', example: 'no-store' },
                  },
                },
                content: {
                  'application/problem+json': {
                    schema: {
                      type: 'object',
                      properties: {
                        type: { type: 'string' },
                        title: { type: 'string' },
                        status: { type: 'integer', example: 402 },
                        detail: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
            security: [{ PaymentAuth: [] }],
          },
        },
        '/submit_relayed_v3': {
          post: {
            operationId: 'submitRelayedV3',
            summary:
              'Submit a Relayed V3 transaction for fee-payer functionality',
            description:
              'Accepts a pre-signed transaction, adds the relayer signature, and broadcasts to the MultiversX network.',
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    required: [
                      'nonce',
                      'value',
                      'receiver',
                      'sender',
                      'relayer',
                      'gasPrice',
                      'gasLimit',
                      'chainID',
                      'version',
                      'signature',
                    ],
                    properties: {
                      nonce: { type: 'integer' },
                      value: { type: 'string' },
                      receiver: {
                        type: 'string',
                        description: 'Bech32 receiver address',
                      },
                      sender: {
                        type: 'string',
                        description: 'Bech32 sender address',
                      },
                      relayer: {
                        type: 'string',
                        description: 'Bech32 relayer address',
                      },
                      gasPrice: { type: 'integer' },
                      gasLimit: { type: 'integer' },
                      data: {
                        type: 'string',
                        description: 'Transaction data (optional)',
                      },
                      chainID: { type: 'string' },
                      version: { type: 'integer', minimum: 2 },
                      options: { type: 'integer' },
                      signature: {
                        type: 'string',
                        description: 'Hex-encoded sender signature',
                      },
                    },
                  },
                },
              },
            },
            responses: {
              '200': {
                description: 'Transaction broadcast successfully',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        success: { type: 'boolean' },
                        txHash: { type: 'string' },
                      },
                    },
                  },
                },
              },
              '400': {
                description:
                  'Bad request — invalid payload or broadcast failure',
              },
              '429': {
                description: 'Rate limit exceeded',
              },
            },
          },
        },
        '/relayer_address': {
          get: {
            operationId: 'getRelayerAddress',
            summary: 'Get the relayer address for Relayed V3 transactions',
            responses: {
              '200': {
                description: 'Relayer address',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        address: {
                          type: 'string',
                          description: 'Bech32 relayer address',
                        },
                      },
                    },
                  },
                },
              },
              '404': {
                description: 'Relayer not configured',
              },
            },
          },
        },
        '/challenges': {
          post: {
            operationId: 'createChallenge',
            summary: 'Register a challenge for verification',
            description:
              'Creates a settlement record so the verifier can later validate a transaction against it.',
            'x-payment-info': {
              intent: 'charge',
              method: 'multiversx',
            },
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    required: ['id', 'receiver', 'amount'],
                    properties: {
                      id: { type: 'string', description: 'Challenge ID' },
                      receiver: {
                        type: 'string',
                        description: 'Expected receiver bech32 address',
                      },
                      amount: {
                        type: 'string',
                        description: 'Expected amount in smallest unit',
                      },
                      currency: {
                        type: 'string',
                        description: 'Token identifier (default: EGLD)',
                      },
                      chainId: {
                        type: 'string',
                        description: 'Chain ID (default: D)',
                      },
                      expiresAt: {
                        type: 'string',
                        format: 'date-time',
                        description: 'Challenge expiry (ISO 8601)',
                      },
                    },
                  },
                },
              },
            },
            responses: {
              '201': {
                description: 'Challenge registered',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        success: { type: 'boolean' },
                        challengeId: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        '/openapi.json': {
          get: {
            operationId: 'getOpenApiSpec',
            summary: 'MPP Service Discovery',
            description:
              'Returns the OpenAPI specification with x-payment-info and x-service-info extensions per the MPP Discovery spec.',
            responses: {
              '200': {
                description: 'OpenAPI 3.1.0 specification',
                content: {
                  'application/json': {
                    schema: { type: 'object' },
                  },
                },
              },
            },
          },
        },
      },
      components: {
        securitySchemes: {
          PaymentAuth: {
            type: 'http',
            scheme: 'Payment',
            description:
              'MPP Payment authentication scheme (RFC draft-httpauth-payment-00)',
          },
        },
      },
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'max-age=300');
    res.status(200).json(openApiSpec);
  }
}
