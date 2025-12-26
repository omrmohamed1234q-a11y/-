// Partner Rating Storage Methods
// Add these methods to the Storage class in storage.ts

import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";

// Partner Rating Operations
export interface PartnerRating {
    id: string;
    partnerId: string;
    userId: string;
    orderId: string | null;
    rating: number;
    review: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreatePartnerRatingInput {
    partnerId: string;
    userId: string;
    orderId: string | null;
    rating: number;
    review: string | null;
}

export interface GetRatingsOptions {
    page: number;
    limit: number;
    sortBy: string;
    order: string;
}

// Add these methods to the Storage class:

async createPartnerRating(input: CreatePartnerRatingInput): Promise < PartnerRating > {
    const id = `rating-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const [rating] = await db.execute(sql`
    INSERT INTO partner_ratings (id, partner_id, user_id, order_id, rating, review)
    VALUES (${id}, ${input.partnerId}, ${input.userId}, ${input.orderId}, ${input.rating}, ${input.review})
    RETURNING *
  `);

    return rating as PartnerRating;
}

async getPartnerRatings(
    partnerId: string,
    options: GetRatingsOptions
): Promise < { ratings: any[]; pagination: any } > {
    const offset = (options.page - 1) * options.limit;
    const orderDirection = options.order === 'asc' ? 'ASC' : 'DESC';

    // Get total count
    const [countResult] = await db.execute(sql`
    SELECT COUNT(*) as total
    FROM partner_ratings
    WHERE partner_id = ${partnerId}
  `);

    const total = parseInt(countResult.total as string);

    // Get ratings with user info
    const ratings = await db.execute(sql`
    SELECT 
      pr.id,
      pr.rating,
      pr.review,
      pr.created_at as "createdAt",
      u.name as "userName"
    FROM partner_ratings pr
    LEFT JOIN users u ON pr.user_id = u.id
    WHERE pr.partner_id = ${partnerId}
    ORDER BY pr.${sql.raw(options.sortBy)} ${sql.raw(orderDirection)}
    LIMIT ${options.limit}
    OFFSET ${offset}
  `);

    return {
        ratings,
        pagination: {
            total,
            page: options.page,
            limit: options.limit,
            totalPages: Math.ceil(total / options.limit),
        },
    };
}

async getUserRatingForOrder(userId: string, orderId: string): Promise < PartnerRating | null > {
    const [rating] = await db.execute(sql`
    SELECT * FROM partner_ratings
    WHERE user_id = ${userId} AND order_id = ${orderId}
    LIMIT 1
  `);

    return rating ? (rating as PartnerRating) : null;
}

async getUserOrdersFromPartner(userId: string, partnerId: string): Promise < any[] > {
    // This assumes orders have a partner_id field or items from partner
    // Adjust based on your actual schema
    const orders = await db.execute(sql`
    SELECT DISTINCT o.*
    FROM orders o
    LEFT JOIN cart_items ci ON ci.order_id = o.id
    WHERE o.user_id = ${userId}
    AND (
      ci.partner_id = ${partnerId}
      OR o.partner_id = ${partnerId}
    )
    ORDER BY o.created_at DESC
  `);

    return orders;
}

// Helper method to get partner (if not exists)
async getPartner(id: string): Promise < any | null > {
    const [partner] = await db.execute(sql`
    SELECT * FROM partners WHERE id = ${id} LIMIT 1
  `);

    return partner || null;
}

// Helper method to get order (if not exists)
async getOrder(id: string): Promise < any | null > {
    const [order] = await db.execute(sql`
    SELECT * FROM orders WHERE id = ${id} LIMIT 1
  `);

    return order || null;
}
