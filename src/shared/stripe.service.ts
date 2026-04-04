import { BadRequestException, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { ConfigService } from 'src/config/config.service';
import Stripe from 'stripe';
@Injectable()
export class StripeService {
  private secretKey = this.configService.get('STRIPE_SECRET_KEY');
  private stripe: Stripe;

  constructor(private readonly configService: ConfigService) {
    this.stripe = new Stripe(this.secretKey, {
      apiVersion: '2025-08-27.basil',
    });
  }

  //------------------------------- CUSTOMER FUNCTIONS ------------------------//

  async createStripeCustomer(customerParams: {
    name: string;
    email: string;
  }): Promise<[Error, Stripe.Customer]> {
    try {
      const customer = await this.stripe.customers.create(customerParams);
      return [null, customer];
    } catch (error) {
      return [error as Error, null];
    }
  }

  async getStripeCustomer(
    customerId: string,
  ): Promise<[Error, Stripe.Customer]> {
    try {
      const customer = await this.stripe.customers.retrieve(customerId);
      return [null, customer as Stripe.Customer];
    } catch (error) {
      return [error as Error, null];
    }
  }

  async deleteStripeCustomer(
    customerId: string,
  ): Promise<[Error, Stripe.DeletedCustomer]> {
    try {
      const customer = await this.stripe.customers.del(customerId);
      return [null, customer];
    } catch (error) {
      return [error as Error, null];
    }
  }

  //------------------------------- CARD FUNCTIONS ------------------------//

  async getCards(customerId: string) {
    try {
      const list = await this.stripe.paymentMethods.list({
        customer: customerId,
        type: 'card',
      });

      return [null, list?.data];
    } catch (error) {
      return [error, null];
    }
  }

  async attachCard(customerId: string) {
    try {
      const form = await this.stripe.checkout.sessions.create({
        success_url: `${this.configService.get(
          'WEB_HOSTED_URL',
        )}account-settings?card-success=true&tab=cards`,
        cancel_url: `${this.configService.get(
          'WEB_HOSTED_URL',
        )}account-settings?card-success=false&tab=cards`,
        mode: 'setup',
        customer: customerId,
        payment_method_types: ['card'],
        currency: 'usd',
      });
      return [null, form];
    } catch (error) {
      return [error, null];
    }
  }

  async getDefaultCard(customerId: string) {
    try {
      const customer = await this.stripe.customers.retrieve(customerId);

      const card = customer['invoice_settings']['default_payment_method'];

      return [null, card];
    } catch (error) {
      return [error, null];
    }
  }

  async setDefaultCard(pmId: string, customerId: string) {
    try {
      const customer = await this.stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: pmId,
        },
      });

      return [null, customer];
    } catch (error) {
      return [error, null];
    }
  }

  async detachCard(pmId: string) {
    try {
      const card = await this.stripe.paymentMethods.detach(pmId);
      return [null, card];
    } catch (error) {
      return [error, null];
    }
  }

  //------------------------------- PRODUCT FUNCTIONS ------------------------//

  async createStripeProduct(productParams: {
    name: string;
    description: string;
    metadata?: {
      [key: string]: string;
    };
  }): Promise<[Error, Stripe.Product]> {
    try {
      const product = await this.stripe.products.create(productParams);
      return [null, product];
    } catch (error) {
      return [error as Error, null];
    }
  }

  async getStripeProduct(productId: string): Promise<[Error, Stripe.Product]> {
    try {
      const product = await this.stripe.products.retrieve(productId);
      return [null, product as Stripe.Product];
    } catch (error) {
      return [error as Error, null];
    }
  }

  async updateStripeProduct(
    productId: string,
    productParams: {
      name: string;
      description: string;
    },
  ): Promise<[Error, Stripe.Product]> {
    try {
      const product = await this.stripe.products.update(
        productId,
        productParams,
      );
      console.log('STRIPE SERVICE', product);

      return [null, product];
    } catch (error) {
      console.log('STRIPE SERVICE', error);
      return [error as Error, null];
    }
  }

  async deleteStripeProduct(
    productId: string,
  ): Promise<[Error, Stripe.DeletedProduct]> {
    try {
      const product = await this.stripe.products.del(productId);
      return [null, product];
    } catch (error) {
      return [error as Error, null];
    }
  }

  //------------------------------- PRICE FUNCTIONS ------------------------//

  async createStripePrice(priceParams: {
    product: string;
    price: number;
    metadata?: {
      [key: string]: string;
    };
  }): Promise<[Error, Stripe.Price]> {
    try {
      const price = await this.stripe.prices.create({
        product: priceParams.product,
        unit_amount: Math.round(priceParams.price * 100),
        currency: 'usd',
        metadata: priceParams.metadata,
      });
      return [null, price];
    } catch (error) {
      return [error as Error, null];
    }
  }

  async createOneTimePrice(priceParams: {
    product: string;
    price: number;
    metadata?: {
      [key: string]: string;
    };
  }): Promise<[Error, Stripe.Price]> {
    try {
      const price = await this.stripe.prices.create({
        product: priceParams.product,
        unit_amount: Math.round(priceParams.price * 100),
        currency: 'usd',
        metadata: priceParams.metadata,
      });
      return [null, price];
    } catch (error) {
      return [error as Error, null];
    }
  }

  async createRecurringPrice(priceParams: {
    product: string;
    price: number;
    interval: 'month' | 'year';
    metadata?: {
      [key: string]: string;
    };
  }): Promise<[Error, Stripe.Price]> {
    try {
      const price = await this.stripe.prices.create({
        product: priceParams.product,
        unit_amount: Math.round(priceParams.price * 100),
        currency: 'usd',
        recurring: {
          interval: priceParams.interval,
        },
        metadata: priceParams.metadata,
      });
      return [null, price];
    } catch (error) {
      return [error as Error, null];
    }
  }

  async getStripePrice(priceId: string): Promise<[Error, Stripe.Price]> {
    try {
      const price = await this.stripe.prices.retrieve(priceId);
      return [null, price as Stripe.Price];
    } catch (error) {
      return [error as Error, null];
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
      return [error as Error, null];
    }
  }

  async getSingleSubscription(
    subscriptionId: string,
  ): Promise<[Error, Stripe.Subscription]> {
    try {
      const subscription =
        await this.stripe.subscriptions.retrieve(subscriptionId);
      return [null, subscription as Stripe.Subscription];
    } catch (error) {
      return [error as Error, null];
    }
  }

  //------------------------------- SUBSCRIPTION FUNCTIONS ------------------------//

  async updateSubscription(params: {
    subscriptionId: string;
    packageId: string;
    priceId: string;
  }): Promise<[Error, Stripe.Subscription]> {
    try {
      const subscription = await this.stripe.subscriptions.retrieve(
        params.subscriptionId,
      );
      if (!subscription) {
        return [new BadRequestException('Subscription not found'), null];
      }

      const updatedSubscription = await this.stripe.subscriptions.update(
        params.subscriptionId,
        {
          proration_behavior: 'create_prorations',
          collection_method: 'charge_automatically',

          cancel_at_period_end: false,
          items: [
            {
              id: subscription.items.data[0].id,
              price: params.priceId,
            },
          ],
          metadata: {
            packageId: params.packageId,
            priceId: params.priceId,
          },
        },
      );
      return [null, updatedSubscription];
    } catch (error) {
      return [error as Error, null];
    }
  }

  async renewSubscription(subscriptionId: string) {
    try {
      const subscription = await this.stripe.subscriptions.update(
        subscriptionId,
        {
          collection_method: 'charge_automatically',
          cancel_at_period_end: false,
        },
      );
      return [null, subscription];
    } catch (error) {
      return [error, null];
    }
  }

  async cancelSubscription(subscriptionId: string) {
    try {
      const subscription = await this.stripe.subscriptions.update(
        subscriptionId,
        {
          cancel_at_period_end: true,
        },
      );
      return [null, subscription];
    } catch (error) {
      return [error, null];
    }
  }

  async deleteSubscription(subscriptionId: string) {
    try {
      const subscription = await this.stripe.subscriptions.cancel(
        subscriptionId,
        {
          prorate: true,
        },
      );
      return [null, subscription];
    } catch (error) {
      return [error, null];
    }
  }

  //------------------------------- CHECKOUT FUNCTIONS ------------------------//

  async createCheckoutSession(checkoutSession: {
    customer: string;
    mode: 'payment' | 'subscription';
    lineItems: Stripe.Checkout.SessionCreateParams.LineItem[];
    metadata?: {
      [key: string]: string;
    };
    isTrial?: boolean;
  }): Promise<[Error, Stripe.Checkout.Session]> {
    console.log('CHECKOUT: ', checkoutSession);
    try {
      const session = await this.stripe.checkout.sessions.create({
        mode: checkoutSession.mode,
        payment_method_types: ['card'],

        customer: checkoutSession.customer,
        line_items: checkoutSession.lineItems,

        allow_promotion_codes: true,

        success_url: `${this.configService.get('WEB_HOSTED_URL')}dashboard?success=true&type=subscription`,
        cancel_url: `${this.configService.get('WEB_HOSTED_URL')}dashboard?success=false&type=subscription`,

        metadata: checkoutSession.metadata,

        consent_collection: { terms_of_service: 'required' },

        ...(!!checkoutSession.isTrial && {
          subscription_data: { trial_period_days: 7 },
        }),
      });
      return [null, session];
    } catch (error) {
      return [error as Error, null];
    }
  }

  //------------------------------- INVOICE FUNCTIONS ------------------------//

  async getInvoice(invoiceId: string): Promise<[Error, Stripe.Invoice]> {
    try {
      const invoice = await this.stripe.invoices.retrieve(invoiceId);
      return [null, invoice];
    } catch (error) {
      return [error as Error, null];
    }
  }

  //------------------------------- WEBHOOK FUNCTIONS ------------------------//

  async constructEvent(
    req: Request,
    secret: string,
  ): Promise<[Error, Stripe.Event]> {
    const sig = req.headers['stripe-signature'];

    try {
      const event: Stripe.Event = this.stripe.webhooks.constructEvent(
        req.body,
        sig,
        secret,
      );

      return [null, event];
    } catch (err) {
      return [err as Error, null];
    }
  }

  async getSetupIntent(
    setupIntentId: string,
  ): Promise<[Error, Stripe.SetupIntent]> {
    try {
      const setupIntent =
        await this.stripe.setupIntents.retrieve(setupIntentId);
      return [null, setupIntent];
    } catch (error) {
      return [error as Error, null];
    }
  }

  async getPaymentIntent(
    paymentIntentId: string,
  ): Promise<[Error, Stripe.PaymentIntent]> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(
        paymentIntentId,
        {
          expand: ['latest_charge'],
        },
      );
      return [null, paymentIntent];
    } catch (error) {
      return [error as Error, null];
    }
  }
}
