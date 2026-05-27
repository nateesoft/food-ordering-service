export abstract class MessageBroker {
  abstract publish<T>(
    eventType: string,
    payload: T,
    branchId?: string | null,
  ): Promise<void>;
}
