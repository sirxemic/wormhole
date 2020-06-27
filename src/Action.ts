export type EventListener<Event> = (e: Event) => void

export class Action<T = undefined> {
  private listeners: Set<EventListener<T>> = new Set()

  public addListener (listener: EventListener<T>) {
    this.listeners.add(listener)
  }

  public removeListener (listener: EventListener<T>) {
    this.listeners.delete(listener)
  }

  public dispatch (event: T) {
    for (let func of this.listeners) {
      func(event)
    }
  }
}
