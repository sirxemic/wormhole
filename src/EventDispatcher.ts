interface Event {
  type: string
}

type EventListener<T> = (e: Event & T) => void

export class EventDispatcher<T> {
  private listeners: Record<string, EventListener<T>[]> = {}

  public addEventListener (type: string, listener: EventListener<T>) {
    this.listeners[type] = this.listeners[type] || []
    this.listeners[type].push(listener)
  }

  protected dispatchEvent (event: Event & T) {
    if (!this.listeners[event.type]) {
      return
    }

    this.listeners[event.type].forEach((func) => {
      func(event)
    })
  }
}