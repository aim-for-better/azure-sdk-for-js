// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import * as log from "../log";
import { Constants, translate, MessagingError } from "@azure/amqp-common";
import { ReceiverEvents, EventContext, OnAmqpEvent, SessionEvents } from "rhea-promise";
import { ServiceBusMessage } from "../serviceBusMessage";
import {
  MessageReceiver,
  ReceiveOptions,
  ReceiverType,
  PromiseLike,
  OnAmqpEventAsPromise
} from "./messageReceiver";
import { ClientEntityContext } from "../clientEntityContext";
import { throwErrorIfConnectionClosed } from "../util/errors";

/**
 * Describes the batching receiver where the user can receive a specified number of messages for
 * a predefined time.
 * @internal
 * @class BatchingReceiver
 * @extends MessageReceiver
 */
export class BatchingReceiver extends MessageReceiver {
  /**
   * @property {boolean} isReceivingMessages Indicates whether the link is actively receiving
   * messages. Default: false.
   */
  isReceivingMessages: boolean = false;

  /**
   * Instantiate a new BatchingReceiver.
   *
   * @constructor
   * @param {ClientEntityContext} context The client entity context.
   * @param {ReceiveOptions} [options]  Options for how you'd like to connect.
   */
  constructor(context: ClientEntityContext, options?: ReceiveOptions) {
    super(context, ReceiverType.batching, options);
  }

  /**
   * Receives a batch of messages from a ServiceBus Queue/Topic.
   * @param maxMessageCount      The maximum number of messages to receive.
   * @param idleTimeoutInSeconds The maximum wait time in seconds for which the Receiver
   * should wait to receive the first message. If no message is received by this time,
   * the returned promise gets resolved to an empty array.
   * @returns {Promise<ServiceBusMessage[]>} A promise that resolves with an array of Message objects.
   */
  receive(maxMessageCount: number, idleTimeoutInSeconds?: number): Promise<ServiceBusMessage[]> {
    throwErrorIfConnectionClosed(this._context.namespace);
    if (!maxMessageCount || (maxMessageCount && typeof maxMessageCount !== "number")) {
      throw new Error(
        "'maxMessageCount' is a required parameter of type number with a value " + "greater than 0."
      );
    }

    if (idleTimeoutInSeconds == undefined) {
      idleTimeoutInSeconds = Constants.defaultOperationTimeoutInSeconds;
    }

    const brokeredMessages: ServiceBusMessage[] = [];

    this.isReceivingMessages = true;
    return new Promise<ServiceBusMessage[]>((resolve, reject) => {
      let onReceiveMessage: OnAmqpEventAsPromise;
      let onSessionClose: OnAmqpEventAsPromise;
      let onReceiveClose: OnAmqpEventAsPromise;
      let onReceiveDrain: OnAmqpEvent;
      let onReceiveError: OnAmqpEvent;
      let onSessionError: OnAmqpEvent;
      let firstMessageWaitTimer: NodeJS.Timer | undefined;

      // Final action to be performed after maxMessageCount is reached or the maxWaitTime is over.
      const finalAction = () => {
        if (this._newMessageReceivedTimer) {
          clearTimeout(this._newMessageReceivedTimer);
        }
        if (firstMessageWaitTimer) {
          clearTimeout(firstMessageWaitTimer);
        }

        // Removing listeners, so that the next receiveMessages() call can set them again.
        if (this._receiver) {
          this._receiver.removeListener(ReceiverEvents.receiverError, onReceiveError);
          this._receiver.removeListener(ReceiverEvents.message, onReceiveMessage);
          this._receiver.session.removeListener(SessionEvents.sessionError, onSessionError);
        }

        if (this._receiver && this._receiver.credit > 0) {
          log.batching(
            "[%s] Receiver '%s': Draining leftover credits(%d).",
            this._context.namespace.connectionId,
            this.name,
            this._receiver.credit
          );

          // Setting drain must be accompanied by a flow call (aliased to addCredit in this case).
          this._receiver.drain = true;
          this._receiver.addCredit(1);
        } else {
          if (this._receiver) {
            this._receiver.removeListener(ReceiverEvents.receiverDrained, onReceiveDrain);
          }

          this.isReceivingMessages = false;
          log.batching(
            "[%s] Receiver '%s': Resolving receiveMessages() with %d messages.",
            this._context.namespace.connectionId,
            this.name,
            brokeredMessages.length
          );
          resolve(brokeredMessages);
        }
      };

      /**
       * Resets the timer when a new message is received. If no messages were received for
       * `newMessageWaitTimeoutInSeconds`, the messages received till now are returned. The
       * receiver link stays open for the next receive call, but doesnt receive messages until then
       */
      this.resetTimerOnNewMessageReceived = () => {
        if (this._newMessageReceivedTimer) clearTimeout(this._newMessageReceivedTimer);
        if (this.newMessageWaitTimeoutInSeconds) {
          this._newMessageReceivedTimer = setTimeout(async () => {
            const msg =
              `BatchingReceiver '${this.name}' did not receive any messages in the last ` +
              `${this.newMessageWaitTimeoutInSeconds} seconds. ` +
              `Hence ending this batch receive operation.`;
            log.error("[%s] %s", this._context.namespace.connectionId, msg);
            finalAction();
          }, this.newMessageWaitTimeoutInSeconds * 1000);
        }
      };

      // Action to be performed after the max wait time is over.
      const actionAfterWaitTimeout = () => {
        log.batching(
          "[%s] Batching Receiver '%s'  max wait time in seconds %d over.",
          this._context.namespace.connectionId,
          this.name,
          idleTimeoutInSeconds
        );
        return finalAction();
      };

      // Action to be performed on the "receiver_drained" event.
      onReceiveDrain = (context: EventContext) => {
        this._receiver!.removeListener(ReceiverEvents.receiverDrained, onReceiveDrain);
        this._receiver!.drain = false;

        this.isReceivingMessages = false;

        log.batching(
          "[%s] Receiver '%s' drained. Resolving receiveMessages() with %d messages.",
          this._context.namespace.connectionId,
          this.name,
          brokeredMessages.length
        );

        resolve(brokeredMessages);
      };

      // Action to be performed on the "message" event.
      onReceiveMessage = async (context: EventContext) => {
        if (firstMessageWaitTimer) {
          clearTimeout(firstMessageWaitTimer);
          firstMessageWaitTimer = undefined;
        }
        this.resetTimerOnNewMessageReceived();
        try {
          const data: ServiceBusMessage = new ServiceBusMessage(
            this._context,
            context.message!,
            context.delivery!,
            true
          );
          if (brokeredMessages.length < maxMessageCount) {
            brokeredMessages.push(data);
          }
        } catch (err) {
          reject(`Error while converting AmqpMessage to ReceivedSBMessage: ${err}`);
        }
        if (brokeredMessages.length === maxMessageCount) {
          finalAction();
        }
      };

      // Action to be taken when an error is received.
      onReceiveError = (context: EventContext) => {
        this.isReceivingMessages = false;
        const receiver = this._receiver || context.receiver!;
        receiver.removeListener(ReceiverEvents.receiverError, onReceiveError);
        receiver.removeListener(ReceiverEvents.message, onReceiveMessage);
        receiver.removeListener(ReceiverEvents.receiverDrained, onReceiveDrain);
        receiver.session.removeListener(SessionEvents.sessionError, onSessionError);

        const receiverError = context.receiver && context.receiver.error;
        let error = new MessagingError("An error occuured while receiving messages.");
        if (receiverError) {
          error = translate(receiverError);
          log.error(
            "[%s] Receiver '%s' received an error:\n%O",
            this._context.namespace.connectionId,
            this.name,
            error
          );
        }
        if (firstMessageWaitTimer) {
          clearTimeout(firstMessageWaitTimer);
        }
        if (this._newMessageReceivedTimer) {
          clearTimeout(this._newMessageReceivedTimer);
        }
        reject(error);
      };

      onReceiveClose = async (context: EventContext) => {
        try {
          this.isReceivingMessages = false;
          const receiverError = context.receiver && context.receiver.error;
          if (receiverError) {
            log.error(
              "[%s] 'receiver_close' event occurred. The associated error is: %O",
              this._context.namespace.connectionId,
              receiverError
            );
          }
        } catch (err) {
          log.error(
            "[%s] Receiver '%s' error in onClose handler:\n%O",
            this._context.namespace.connectionId,
            this.name,
            translate(err)
          );
        }
      };

      onSessionClose = async (context: EventContext) => {
        try {
          this.isReceivingMessages = false;
          const sessionError = context.session && context.session.error;
          if (sessionError) {
            log.error(
              "[%s] 'session_close' event occurred for receiver '%s'. The associated error is: %O",
              this._context.namespace.connectionId,
              this.name,
              sessionError
            );
          }
        } catch (err) {
          log.error(
            "[%s] Receiver '%s' error in onSessionClose handler:\n%O",
            this._context.namespace.connectionId,
            this.name,
            translate(err)
          );
        }
      };

      onSessionError = (context: EventContext) => {
        this.isReceivingMessages = false;
        const receiver = this._receiver || context.receiver!;
        receiver.removeListener(ReceiverEvents.receiverError, onReceiveError);
        receiver.removeListener(ReceiverEvents.message, onReceiveMessage);
        receiver.removeListener(ReceiverEvents.receiverDrained, onReceiveDrain);
        receiver.session.removeListener(SessionEvents.sessionError, onSessionError);

        const sessionError = context.session && context.session.error;
        let error = new MessagingError("An error occuured while receiving messages.");
        if (sessionError) {
          error = translate(sessionError);
          log.error(
            "[%s] 'session_close' event occurred for Receiver '%s' received an error:\n%O",
            this._context.namespace.connectionId,
            this.name,
            error
          );
        }
        if (firstMessageWaitTimer) {
          clearTimeout(firstMessageWaitTimer);
        }
        if (this._newMessageReceivedTimer) {
          clearTimeout(this._newMessageReceivedTimer);
        }
        reject(error);
      };

      const onSettled: OnAmqpEvent = (context: EventContext) => {
        const connectionId = this._context.namespace.connectionId;
        const delivery = context.delivery;
        if (delivery) {
          const id = delivery.id;
          const state = delivery.remote_state;
          const settled = delivery.remote_settled;
          log.receiver(
            "[%s] Delivery with id %d, remote_settled: %s, remote_state: %o has been " +
              "received.",
            connectionId,
            id,
            settled,
            state && state.error ? state.error : state
          );
          if (settled && this._deliveryDispositionMap.has(id)) {
            const promise = this._deliveryDispositionMap.get(id) as PromiseLike;
            clearTimeout(promise.timer);
            log.receiver(
              "[%s] Found the delivery with id %d in the map and cleared the timer.",
              connectionId,
              id
            );
            const deleteResult = this._deliveryDispositionMap.delete(id);
            log.receiver(
              "[%s] Successfully deleted the delivery with id %d from the map.",
              connectionId,
              id,
              deleteResult
            );
            if (state && state.error && (state.error.condition || state.error.description)) {
              const error = translate(state.error);
              return promise.reject(error);
            }

            return promise.resolve();
          }
        }
      };

      const addCreditAndSetTimer = (reuse?: boolean) => {
        log.batching(
          "[%s] Receiver '%s', adding credit for receiving %d messages.",
          this._context.namespace.connectionId,
          this.name,
          maxMessageCount
        );
        // By adding credit here, we let the service know that at max we can handle `maxMessageCount`
        // number of messages concurrently. We will return the user an array of messages that can
        // be of size upto maxMessageCount. Then the user needs to accordingly dispose
        // (complete,/abandon/defer/deadletter) the messages from the array.
        this._receiver!.addCredit(maxMessageCount);
        let msg: string = "[%s] Setting the wait timer for %d seconds for receiver '%s'.";
        if (reuse) msg += " Receiver link already present, hence reusing it.";
        log.batching(msg, this._context.namespace.connectionId, idleTimeoutInSeconds, this.name);
        firstMessageWaitTimer = setTimeout(
          actionAfterWaitTimeout,
          (idleTimeoutInSeconds as number) * 1000
        );
        // TODO: Disabling this for now. We would want to give the user a decent chance to receive
        // the first message and only timeout faster if successive messages from there onwards are
        // not received quickly. However, it may be possible that there are no pending messages
        // currently on the queue. In that case waiting for idleTimeoutInSeconds would be
        // unnecessary.
        // There is a management plane API to get runtimeInfo of the Queue which provides
        // information about active messages on the Queue and it's sub Queues. However, this adds
        // a little complexity. If the first message was delayed due to network latency then there
        // are bright chances that the management plane api would receive the same fate.
        // It would be better to weigh all the options before making a decision.
        // resetTimerOnNewMessageReceived();
      };

      if (!this.isOpen()) {
        log.batching(
          "[%s] Receiver '%s', setting max concurrent calls to 0.",
          this._context.namespace.connectionId,
          this.name
        );
        // while creating the receiver link for batching receiver the max concurrent calls
        // i.e. the credit_window on the link is set to zero. After the link is created
        // successfully, we add credit which is the maxMessageCount specified by the user.
        this.maxConcurrentCalls = 0;
        const rcvrOptions = this._createReceiverOptions(false, {
          onMessage: onReceiveMessage,
          onError: onReceiveError,
          onSessionError: onSessionError,
          onSettled: onSettled,
          onClose: onReceiveClose,
          onSessionClose: onSessionClose
        });
        this._init(rcvrOptions)
          .then(() => {
            this._receiver!.on(ReceiverEvents.receiverDrained, onReceiveDrain);
            addCreditAndSetTimer();
          })
          .catch(reject);
      } else {
        addCreditAndSetTimer(true);
        this._receiver!.on(ReceiverEvents.message, onReceiveMessage);
        this._receiver!.on(ReceiverEvents.receiverError, onReceiveError);
        this._receiver!.on(ReceiverEvents.receiverDrained, onReceiveDrain);
        this._receiver!.session.on(SessionEvents.sessionError, onSessionError);
      }
    });
  }

  /**
   * Creates a batching receiver.
   * @static
   *
   * @param {ClientEntityContext} context    The connection context.
   * @param {ReceiveOptions} [options]     Receive options.
   */
  static create(context: ClientEntityContext, options?: ReceiveOptions): BatchingReceiver {
    throwErrorIfConnectionClosed(context.namespace);
    const bReceiver = new BatchingReceiver(context, options);
    context.batchingReceiver = bReceiver;
    return bReceiver;
  }
}
