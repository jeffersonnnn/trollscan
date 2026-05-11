import { EventEmitter } from "events";

const globalForEvents = globalThis as typeof globalThis & {
  __trollscanEvents?: EventEmitter;
};

if (!globalForEvents.__trollscanEvents) {
  globalForEvents.__trollscanEvents = new EventEmitter();
  globalForEvents.__trollscanEvents.setMaxListeners(100);
}

export const emitter = globalForEvents.__trollscanEvents;
