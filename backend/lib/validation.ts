// Input Validation Middleware using Zod
import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Validate request body against a Zod schema
 *
 * Usage:
 * ```typescript
 * import { validateRequest, schemas } from '@/lib/validation';
 *
 * export async function POST(request: NextRequest) {
 *   const validation = await validateRequest(request, schemas.login);
 *   if (!validation.success) {
 *     return validation.response;
 *   }
 *
 *   const data = validation.data;
 *   // Process validated data...
 * }
 * ```
 */
export async function validateRequest<T extends z.ZodType>(
  request: NextRequest,
  schema: T
): Promise<
  | { success: true; data: z.infer<T> }
  | { success: false; response: NextResponse }
> {
  try {
    const body = await request.json();
    const validated = schema.parse(body);

    return {
      success: true,
      data: validated,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        response: NextResponse.json(
          {
            success: false,
            error: 'Validation failed',
            details: error.errors.map((err) => ({
              field: err.path.join('.'),
              message: err.message,
            })),
          },
          { status: 400 }
        ),
      };
    }

    return {
      success: false,
      response: NextResponse.json(
        {
          success: false,
          error: 'Invalid request body',
        },
        { status: 400 }
      ),
    };
  }
}

/**
 * Validation Schemas
 */
export const schemas = {
  // Authentication
  register: z.object({
    email: z.string().email('Invalid email address'),
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .max(30, 'Username must be at most 30 characters')
      .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  }),

  login: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),

  // Posts
  createPost: z.object({
    content: z.string().min(1, 'Content is required').max(5000, 'Content too long'),
    mediaUrls: z.array(z.string().url()).max(10, 'Maximum 10 media files').optional(),
    campusHubId: z.string().uuid().optional(),
    visibility: z.enum(['public', 'followers', 'private']).optional(),
  }),

  // Marketplace
  createProduct: z.object({
    name: z.string().min(3, 'Product name must be at least 3 characters'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    price: z.number().positive('Price must be positive').max(10000000, 'Price too high'),
    category: z.string().min(1, 'Category is required'),
    stock: z.number().int().min(0, 'Stock cannot be negative'),
    images: z.array(z.string().url()).min(1, 'At least one image required').max(5, 'Maximum 5 images'),
    affiliateSettings: z
      .object({
        enabled: z.boolean(),
        commission: z.number().min(0).max(50, 'Commission cannot exceed 50%'),
      })
      .optional(),
  }),

  createOrder: z.object({
    items: z
      .array(
        z.object({
          productId: z.string().uuid(),
          quantity: z.number().int().positive('Quantity must be positive'),
        })
      )
      .min(1, 'At least one item required'),
    shippingAddress: z.object({
      fullName: z.string().min(2),
      phone: z.string().min(10),
      address: z.string().min(10),
      city: z.string().min(2),
      state: z.string().min(2),
      zipCode: z.string().min(5),
    }),
    paymentMethod: z.enum(['wallet', 'paystack', 'card']),
  }),

  // Wallet
  withdrawal: z.object({
    amount: z.number().positive('Amount must be positive').min(1000, 'Minimum withdrawal is ₦1,000'),
    bankDetails: z.object({
      accountName: z.string().min(2),
      accountNumber: z.string().regex(/^\d{10}$/, 'Account number must be 10 digits'),
      bankCode: z.string().min(3),
      bankName: z.string().min(2),
    }),
  }),

  // Battles
  createBattle: z.object({
    type: z.enum(['gift_war', 'talent_showdown']),
    opponentId: z.string().uuid().optional(),
    prizeAmount: z.number().positive('Prize must be positive').min(1000, 'Minimum prize is ₦1,000'),
    duration: z.number().int().min(2, 'Minimum 2 minutes').max(30, 'Maximum 30 minutes'),
  }),

  sendGift: z.object({
    recipientSide: z.enum(['host1', 'host2']),
    giftType: z.string().min(1),
    quantity: z.number().int().positive().max(100, 'Maximum 100 gifts at once'),
  }),

  // Affiliate
  affiliateApplication: z.object({
    audienceSize: z.number().int().min(1000, 'Minimum audience size is 1,000'),
    primaryPlatform: z.string().min(2),
    contentType: z.string().min(2),
    reason: z.string().min(50, 'Please provide more details (minimum 50 characters)'),
  }),

  payoutRequest: z.object({
    amount: z.number().positive().min(1000, 'Minimum payout is ₦1,000'),
  }),

  // Creator Subscriptions
  subscriptionSettings: z.object({
    enabled: z.boolean(),
    tiers: z.object({
      basic: z.object({
        enabled: z.boolean(),
        price: z.number().min(300, 'Basic tier minimum is ₦300'),
        benefits: z.array(z.string()).min(1, 'At least one benefit required'),
      }),
      premium: z.object({
        enabled: z.boolean(),
        price: z.number().min(800, 'Premium tier minimum is ₦800'),
        benefits: z.array(z.string()).min(1, 'At least one benefit required'),
      }),
      vip: z.object({
        enabled: z.boolean(),
        price: z.number().min(1500, 'VIP tier minimum is ₦1,500'),
        benefits: z.array(z.string()).min(1, 'At least one benefit required'),
      }),
    }),
  }),

  // Support Tickets
  createTicket: z.object({
    subject: z.string().min(5, 'Subject must be at least 5 characters'),
    category: z.string().min(2),
    priority: z.enum(['low', 'medium', 'high']),
    message: z.string().min(20, 'Message must be at least 20 characters'),
  }),

  // Content Appeals
  submitAppeal: z.object({
    contentId: z.string().uuid(),
    reason: z.string().min(1),
    explanation: z.string().min(50, 'Please provide more details (minimum 50 characters)'),
  }),

  // Admin Actions
  moderateContent: z.object({
    action: z.enum(['approve', 'warn', 'remove']),
    reason: z.string().min(10).optional(),
  }),

  userAction: z.object({
    action: z.enum(['verify', 'warn', 'ban', 'unban']),
    reason: z.string().min(10),
    duration: z.number().int().positive().optional(), // For bans (in days)
  }),
};

/**
 * Validate query parameters
 */
export function validateQueryParams<T extends z.ZodType>(
  request: NextRequest,
  schema: T
): { success: true; data: z.infer<T> } | { success: false; response: NextResponse } {
  try {
    const url = new URL(request.url);
    const params: Record<string, string> = {};

    url.searchParams.forEach((value, key) => {
      params[key] = value;
    });

    const validated = schema.parse(params);

    return {
      success: true,
      data: validated,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        response: NextResponse.json(
          {
            success: false,
            error: 'Invalid query parameters',
            details: error.errors.map((err) => ({
              field: err.path.join('.'),
              message: err.message,
            })),
          },
          { status: 400 }
        ),
      };
    }

    return {
      success: false,
      response: NextResponse.json(
        {
          success: false,
          error: 'Invalid query parameters',
        },
        { status: 400 }
      ),
    };
  }
}

/**
 * Common query parameter schemas
 */
export const querySchemas = {
  pagination: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    pageSize: z.string().regex(/^\d+$/).transform(Number).optional(),
  }),

  idParam: z.object({
    id: z.string().uuid('Invalid ID format'),
  }),
};
