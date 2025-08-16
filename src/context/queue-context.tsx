'use client';

import type { ReactNode } from 'react';
import React, { createContext, useContext, useReducer, useEffect } from 'react';

export interface Service {
  id: string;
  name: string;
  icon: ReactNode;
}

export interface Ticket {
  number: string;
  service: Service;
  timestamp: Date;
  status: 'waiting' | 'serving' | 'done';
}

export interface ServingInfo {
  ticket: Ticket;
  counter: number;
}

export interface Staff {
  id: string;
  name: string;
  counters: number[];
}

export interface Counter {
    id: number;
    name: string;
    status: 'open' | 'closed';
}

interface QueueState {
  tickets: Ticket[];
  servingHistory: ServingInfo[];
  nowServing: ServingInfo | null;
  counters: Counter[];
  services: Service[];
  staff: Staff[];
  serviceCounters: Record<string, number>;
}

type Action =
  | { type: 'ADD_TICKET'; payload: Ticket }
  | { type: 'CALL_NEXT'; payload: { serviceId: string; counter: number } }
  | { type: 'COMPLETE_TICKET'; payload: { ticketNumber: string } }
  | { type: 'RECALL_TICKET' }
  | { type: 'RESET_STATE' }
  | { type: 'SET_SERVICES', payload: Service[] }
  | { type: 'SET_COUNTERS', payload: Counter[] }
  | { type: 'SET_STAFF', payload: Staff[] }
  | { type: 'ADD_STAFF', payload: Staff }
  | { type: 'UPDATE_STAFF', payload: Staff }
  | { type: 'DELETE_STAFF', payload: string }
  | { type: 'ADD_COUNTER', payload: Counter }
  | { type: 'UPDATE_COUNTER', payload: Counter }
  | { type: 'DELETE_COUNTER', payload: number }
  | { type: 'ADD_SERVICE', payload: Service }
  | { type: 'UPDATE_SERVICE', payload: Service }
  | { type: 'DELETE_SERVICE', payload: string };


const initialState: QueueState = {
  tickets: [],
  servingHistory: [],
  nowServing: null,
  counters: [
      {id: 1, name: 'Loket 1', status: 'open'},
      {id: 2, name: 'Loket 2', status: 'open'},
      {id: 3, name: 'Loket 3', status: 'closed'},
      {id: 4, name: 'Loket 4', status: 'open'},
  ],
  services: [
    { id: 'A', name: 'Layanan Konsultasi', icon: 'Users' },
    { id: 'B', name: 'Pengajuan Perizinan', icon: 'Briefcase' },
    { id: 'C', name: 'Layanan Prioritas', icon: 'Ticket' },
  ].map(s => ({...s, icon: <></>})),
  staff: [
      {id: '1', name: 'Budi', counters: [1]},
      {id: '2', name: 'Ani', counters: [2]},
      {id: '3', name: 'Candra', counters: [4]},
  ],
  serviceCounters: {},
};

function queueReducer(state: QueueState, action: Action): QueueState {
  switch (action.type) {
    case 'ADD_TICKET': {
      return {
        ...state,
        tickets: [...state.tickets, action.payload],
      };
    }
    case 'CALL_NEXT': {
      const { serviceId, counter } = action.payload;
      const waitingTickets = state.tickets.filter(
        (t) => t.service.id === serviceId && t.status === 'waiting'
      );

      if (waitingTickets.length === 0) {
        return state;
      }

      const nextTicket = waitingTickets[0];
      const service = state.services.find(s => s.id === serviceId);
      if(!service) return state;

      const updatedNowServing = { ticket: { ...nextTicket, status: 'serving' as const, service }, counter };

      return {
        ...state,
        nowServing: updatedNowServing,
        tickets: state.tickets.map((t) =>
          t.number === nextTicket.number ? { ...t, status: 'serving' as const } : t
        ),
        servingHistory: [updatedNowServing, ...state.servingHistory].slice(0, 5),
      };
    }
    case 'COMPLETE_TICKET': {
       return {
        ...state,
        tickets: state.tickets.map((t) =>
          t.number === action.payload.ticketNumber ? { ...t, status: 'done' as const } : t
        ),
        nowServing: null,
       }
    }
    case 'RECALL_TICKET': {
        // This action doesn't change state but is useful for triggering effects like speech
        return state;
    }
    case 'SET_SERVICES':
        return { ...state, services: action.payload };
    case 'SET_COUNTERS':
        return { ...state, counters: action.payload };
    case 'SET_STAFF':
        return { ...state, staff: action.payload };
    case 'ADD_STAFF':
        return { ...state, staff: [...state.staff, action.payload] };
    case 'UPDATE_STAFF':
        return { ...state, staff: state.staff.map(s => s.id === action.payload.id ? action.payload : s) };
    case 'DELETE_STAFF':
        return { ...state, staff: state.staff.filter(s => s.id !== action.payload) };
    case 'ADD_COUNTER':
        return { ...state, counters: [...state.counters, action.payload] };
    case 'UPDATE_COUNTER':
        return { ...state, counters: state.counters.map(c => c.id === action.payload.id ? action.payload : c) };
    case 'DELETE_COUNTER':
        return { ...state, counters: state.counters.filter(c => c.id !== action.payload) };
    case 'ADD_SERVICE':
        return { ...state, services: [...state.services, action.payload] };
    case 'UPDATE_SERVICE':
        return { ...state, services: state.services.map(s => s.id === action.payload.id ? action.payload : s) };
    case 'DELETE_SERVICE':
        return { ...state, services: state.services.filter(s => s.id !== action.payload) };
    case 'RESET_STATE':
      return initialState;
    default:
      return state;
  }
}

interface QueueContextType {
  state: QueueState;
  addTicket: (service: Service) => Ticket;
  callNextTicket: (serviceId: string, counter: number) => void;
  completeTicket: (ticketNumber: string) => void;
  recallTicket: () => void;
  setServices: (services: Service[]) => void;
  setCounters: (counters: Counter[]) => void;
  setStaff: (staff: Staff[]) => void;
  addStaff: (staff: Omit<Staff, 'id'>) => void;
  updateStaff: (staff: Staff) => void;
  deleteStaff: (staffId: string) => void;
  addCounter: (counter: Omit<Counter, 'id'>) => void;
  updateCounter: (counter: Counter) => void;
  deleteCounter: (counterId: number) => void;
  addService: (service: Omit<Service, 'icon'>) => void;
  updateService: (service: Omit<Service, 'icon'>) => void;
  deleteService: (serviceId: string) => void;
}

const QueueContext = createContext<QueueContextType | undefined>(undefined);

export const QueueProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(queueReducer, initialState);

  const addTicket = (service: Service): Ticket => {
    const serviceTickets = state.tickets.filter(t => t.service.id === service.id);
    const newTicketNumber = `${service.id}-${String(serviceTickets.length + 1).padStart(3, '0')}`;
    const newTicket: Ticket = {
      number: newTicketNumber,
      service,
      timestamp: new Date(),
      status: 'waiting',
    };
    dispatch({ type: 'ADD_TICKET', payload: newTicket });
    return newTicket;
  };

  const callNextTicket = (serviceId: string, counter: number) => {
    dispatch({ type: 'CALL_NEXT', payload: { serviceId, counter } });
  };
  
  const completeTicket = (ticketNumber: string) => {
    dispatch({ type: 'COMPLETE_TICKET', payload: { ticketNumber } });
  };
  
  const recallTicket = () => {
    dispatch({ type: 'RECALL_TICKET' });
  }

  const setServices = (services: Service[]) => {
      dispatch({type: 'SET_SERVICES', payload: services});
  }
  const setCounters = (counters: Counter[]) => {
      dispatch({type: 'SET_COUNTERS', payload: counters});
  }
  const setStaff = (staff: Staff[]) => {
      dispatch({type: 'SET_STAFF', payload: staff});
  }
  
  const addStaff = (staff: Omit<Staff, 'id'>) => {
      const newStaff = { ...staff, id: new Date().toISOString() };
      dispatch({ type: 'ADD_STAFF', payload: newStaff });
  }

  const updateStaff = (staff: Staff) => {
      dispatch({ type: 'UPDATE_STAFF', payload: staff });
  }

  const deleteStaff = (staffId: string) => {
      dispatch({ type: 'DELETE_STAFF', payload: staffId });
  }

  const addCounter = (counter: Omit<Counter, 'id'>) => {
    const newId = state.counters.length > 0 ? Math.max(...state.counters.map(c => c.id)) + 1 : 1;
    dispatch({ type: 'ADD_COUNTER', payload: {...counter, id: newId } });
  }

  const updateCounter = (counter: Counter) => {
      dispatch({ type: 'UPDATE_COUNTER', payload: counter });
  }

  const deleteCounter = (counterId: number) => {
      dispatch({ type: 'DELETE_COUNTER', payload: counterId });
  }

  const addService = (service: Omit<Service, 'icon'>) => {
      dispatch({ type: 'ADD_SERVICE', payload: {...service, icon: <></>} });
  }

  const updateService = (service: Omit<Service, 'icon'>) => {
      dispatch({ type: 'UPDATE_SERVICE', payload: {...service, icon: <></>} });
  }

  const deleteService = (serviceId: string) => {
      dispatch({ type: 'DELETE_SERVICE', payload: serviceId });
  }

  return (
    <QueueContext.Provider value={{ state, addTicket, callNextTicket, completeTicket, recallTicket, setServices, setCounters, setStaff, addStaff, updateStaff, deleteStaff, addCounter, updateCounter, deleteCounter, addService, updateService, deleteService }}>
      {children}
    </QueueContext.Provider>
  );
};

export const useQueue = () => {
  const context = useContext(QueueContext);
  if (context === undefined) {
    throw new Error('useQueue must be used within a QueueProvider');
  }
  return context;
};
