import { Injectable } from '@nestjs/common';
import { ConfigService } from 'src/config/config.service';
import Stripe from 'stripe';

type StripeResponse<T> = Promise<[Error | null, T | null]>;

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor(private readonly configService: ConfigService) {
    this.stripe = new Stripe(
      this.configService.get('STRIPE_SECRET_KEY') as string,
      {
        apiVersion: '2025-02-24.acacia',
      },
    );
  }

  // -------------------------- CUSTOMERS --------------------------
  /**
   * Create Customer
   */
  async createCustomer(
    email: string,
    name?: string,
  ): StripeResponse<Stripe.Customer> {
    try {
      const customer = await this.stripe.customers.create({
        email,
        name,
      });

      return [null, customer];
    } catch (error) {
      return [error, null];
    }
  }

  async deleteCustomer(
    customerId: string,
  ): StripeResponse<Stripe.DeletedCustomer> {
    try {
      const deletedCustomer = await this.stripe.customers.del(customerId);

      return [null, deletedCustomer];
    } catch (error) {
      return [error, null];
    }
  }

  // -------------------------- PRODUCTS --------------------------
  /**
   * Create Product
   */
  async createProduct(
    name: string,
    description?: string,
    metadata?: Record<string, string>,
  ): StripeResponse<Stripe.Product> {
    try {
      const product = await this.stripe.products.create({
        name,
        description,
        metadata,
      });

      return [null, product];
    } catch (error) {
      return [error, null];
    }
  }

  // -------------------------- PRICES --------------------------

  /**
   * Create Price
   */
  async createPrice(
    productId: string,
    unitAmount: number,
    currency: string = 'usd',
    recurringInterval?: 'month' | 'year',
  ): StripeResponse<Stripe.Price> {
    try {
      const price = await this.stripe.prices.create({
        product: productId,
        unit_amount: unitAmount,
        currency,
        recurring: recurringInterval
          ? { interval: recurringInterval }
          : undefined,
      });

      return [null, price];
    } catch (error) {
      return [error, null];
    }
  }

  /**
   * Delete Price (actually deactivates price)
   */
  async deletePrice(priceId: string): StripeResponse<Stripe.Price> {
    try {
      const price = await this.stripe.prices.update(priceId, {
        active: false,
      });

      return [null, price];
    } catch (error) {
      return [error, null];
    }
  }

  /**
   * Update Price
   */
  async changeProductPrice(
    productId: string,
    newAmount: number,
    oldPriceId?: string,
  ): Promise<[Error | null, Stripe.Price | null]> {
    try {
      const newPrice = await this.stripe.prices.create({
        product: productId,
        unit_amount: newAmount,
        currency: 'usd',
      });

      if (oldPriceId) {
        await this.stripe.prices.update(oldPriceId, {
          active: false,
        });
      }

      return [null, newPrice];
    } catch (error) {
      return [error, null];
    }
  }

  // -------------------------- SUBSCRIPTIONS --------------------------
  /**
   * Create Subscription
   */
  async createSubscription(
    customerId: string,
    priceId: string,
  ): StripeResponse<Stripe.Subscription> {
    try {
      const subscription = await this.stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        // currency: 'usd',
        // interval: 'month',
        // trial_period_days: 7,
      });

      return [null, subscription];
    } catch (error) {
      return [error, null];
    }
  }

  async createCheckoutSession(
    customerId: string,
    priceId: string,
    metadata: Record<string, string>,
  ): StripeResponse<Stripe.Checkout.Session> {
    try {
      const checkoutSession = await this.stripe.checkout.sessions.create({
        customer: customerId,
        line_items: [{ price: priceId, quantity: 1 }],
        mode: 'subscription',
        success_url: `${this.configService.get('WEB_HOSTED_URL')}/subscription?success=true`,
        cancel_url: `${this.configService.get('WEB_HOSTED_URL')}/subscription?success=false`,
        metadata,
      });

      return [null, checkoutSession];
    } catch (error) {
      return [error, null];
    }
  }
}
