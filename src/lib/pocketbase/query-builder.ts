/**
 * Type-Safe PocketBase Query Builder
 *
 * Provides a fluent, type-safe API for building PocketBase filter queries.
 * Prevents injection attacks and eliminates typos in filter strings.
 */

import { escapeFilterValue } from './client';

type FilterOperator = '=' | '!=' | '>' | '>=' | '<' | '<=' | '~' | '!~';
type LogicalOperator = '&&' | '||';

interface FilterCondition {
  field: string;
  operator: FilterOperator;
  value: string | number | boolean | null;
}

interface FilterGroup {
  conditions: (FilterCondition | FilterGroup)[];
  operator: LogicalOperator;
}

/**
 * Query builder for PocketBase filters
 *
 * @example
 * const filter = new QueryBuilder()
 *   .where('status', '=', 'active')
 *   .and('categoryId', '=', categoryId)
 *   .or(qb => qb.where('name', '~', query).or('description', '~', query))
 *   .build();
 */
export class QueryBuilder {
  private conditions: (FilterCondition | FilterGroup | string)[] = [];
  private operators: LogicalOperator[] = [];

  /**
   * Add a filter condition
   */
  where(field: string, operator: FilterOperator, value: string | number | boolean | null): this {
    this.conditions.push({ field, operator, value });
    return this;
  }

  /**
   * Add an AND condition
   */
  and(field: string, operator: FilterOperator, value: string | number | boolean | null): this {
    this.operators.push('&&');
    this.conditions.push({ field, operator, value });
    return this;
  }

  /**
   * Add an OR condition
   */
  or(field: string, operator: FilterOperator, value: string | number | boolean | null): this {
    this.operators.push('||');
    this.conditions.push({ field, operator, value });
    return this;
  }

  /**
   * Add a grouped AND condition
   */
  andGroup(builder: (qb: QueryBuilder) => QueryBuilder): this {
    this.operators.push('&&');
    const group = builder(new QueryBuilder());
    this.conditions.push(`(${group.build()})`);
    return this;
  }

  /**
   * Add a grouped OR condition
   */
  orGroup(builder: (qb: QueryBuilder) => QueryBuilder): this {
    this.operators.push('||');
    const group = builder(new QueryBuilder());
    this.conditions.push(`(${group.build()})`);
    return this;
  }

  /**
   * Add a raw filter string (use sparingly, escaping is your responsibility)
   */
  raw(filter: string): this {
    this.conditions.push(filter);
    return this;
  }

  /**
   * Add a raw AND filter string
   */
  andRaw(filter: string): this {
    this.operators.push('&&');
    this.conditions.push(filter);
    return this;
  }

  /**
   * Build the filter string
   */
  build(): string {
    if (this.conditions.length === 0) {
      return '';
    }

    const parts: string[] = [];

    for (let i = 0; i < this.conditions.length; i++) {
      const condition = this.conditions[i];

      // Add operator before condition (except for first)
      if (i > 0 && this.operators[i - 1]) {
        parts.push(` ${this.operators[i - 1]} `);
      }

      if (typeof condition === 'string') {
        // Raw filter string
        parts.push(condition);
      } else if ('field' in condition) {
        // Regular condition
        parts.push(this.buildCondition(condition));
      }
    }

    return parts.join('');
  }

  private buildCondition(condition: FilterCondition): string {
    const { field, operator, value } = condition;

    if (value === null) {
      return `${field} ${operator} null`;
    }

    if (typeof value === 'boolean') {
      return `${field} ${operator} ${value}`;
    }

    if (typeof value === 'number') {
      return `${field} ${operator} ${value}`;
    }

    // String value - escape and quote
    const escapedValue = escapeFilterValue(value);
    return `${field} ${operator} "${escapedValue}"`;
  }
}

/**
 * Create a new query builder instance
 */
export function createQuery(): QueryBuilder {
  return new QueryBuilder();
}

/**
 * Build a simple equality filter
 */
export function buildFilter(filters: Record<string, string | number | boolean | null | undefined>): string {
  const query = new QueryBuilder();
  let isFirst = true;

  for (const [field, value] of Object.entries(filters)) {
    if (value === undefined) continue;

    if (isFirst) {
      query.where(field, '=', value);
      isFirst = false;
    } else {
      query.and(field, '=', value);
    }
  }

  return query.build();
}

/**
 * Build a search filter across multiple fields
 */
export function buildSearchFilter(query: string, fields: string[]): string {
  if (!query || fields.length === 0) {
    return '';
  }

  const escapedQuery = escapeFilterValue(query);
  const conditions = fields.map((field) => `${field} ~ "${escapedQuery}"`);
  return `(${conditions.join(' || ')})`;
}

/**
 * Build a filter for values in a list
 */
export function buildInFilter(field: string, values: string[]): string {
  if (values.length === 0) {
    return '';
  }

  const conditions = values.map((value) => {
    const escaped = escapeFilterValue(value);
    return `${field} = "${escaped}"`;
  });

  return `(${conditions.join(' || ')})`;
}

/**
 * Common filter presets
 */
export const Filters = {
  /** Filter for active products */
  activeProducts: () => createQuery().where('status', '=', 'active'),

  /** Filter for featured products */
  featuredProducts: () =>
    createQuery().where('status', '=', 'active').and('isFeatured', '=', true),

  /** Filter for user's orders */
  userOrders: (userId: string) => createQuery().where('userId', '=', userId),

  /** Filter for orders by status */
  ordersByStatus: (status: string) => createQuery().where('status', '=', status),

  /** Filter for active discounts */
  activeDiscounts: () =>
    createQuery().where('isActive', '=', true),
} as const;
