import {filter, Observable, Subject} from 'rxjs';

export enum EventType {
    OPEN_CREATE_PROPERTY,
    ACTIVATE_PROPERTY
}

export interface Event {
    type: EventType;
    payload?: any;
}


class EventServiceImpl {
    subject = new Subject<Event>();

    emit(eventType: EventType, payload?: any) {
        this.subject.next({type: eventType, payload});
    }

    subscribe() {
        return this.subject.asObservable();
    }

    subscribeToEvent(eventType: EventType): Observable<Event> {
        return this.subject.asObservable()
            .pipe(filter(e => e.type === eventType));
    }

    subscribeToEvents(eventTypes: EventType[] = []) {
        return this.subject.asObservable()
            .pipe(filter(e => eventTypes.includes(e.type)));
    }
}

export const EventService = new EventServiceImpl();
