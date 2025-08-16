'use client';

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { 
    collection, 
    onSnapshot, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    doc, 
    query, 
    where, 
    orderBy, 
    limit, 
    getDocs,
    Timestamp,
    serverTimestamp,
    writeBatch,
    runTransaction,
    setDoc
} from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

// Interfaces
export interface Service {
  id: string;
  name: string;
  icon?: ReactNode; // Icon is UI specific, won't be in Firestore
}

export interface Ticket {
  id: string; // Firestore document ID
  number: string;
  serviceId: string;
  service: Service; // This will be enriched data
  timestamp: Date;
  status: 'waiting' | 'serving' | 'done';
}

export interface ServingInfo {
  ticket: Ticket;
  counter: number;
}

export interface Staff {
  id: string; // Firestore document ID
  name: string;
  counters: number[];
}

export interface Counter {
    id: number; // Keep this as a number if it's used as such, but Firestore ID will be string
    docId: string; // Firestore document ID
    name: string;
    status: 'open' | 'closed';
}

export interface User {
  uid: string;
  email: string;
  role: 'admin' | 'staff';
}


// Raw Firestore data types
interface TicketDoc {
    number: string;
    serviceId: string;
    timestamp: Timestamp;
    status: 'waiting' | 'serving' | 'done';
}
interface NowServingDoc {
    ticketId: string;
    counter: number;
}


interface QueueState {
  tickets: Ticket[];
  servingHistory: ServingInfo[];
  nowServing: ServingInfo | null;
  counters: Counter[];
  services: Service[];
  staff: Staff[];
  currentUser: User | null;
}

interface QueueContextType {
  state: QueueState;
  loginUser: (user: User) => void;
  logoutUser: () => void;
  addTicket: (service: Service) => Promise<Ticket | null>;
  callNextTicket: (serviceId: string, counter: number) => Promise<void>;
  completeTicket: (ticketId: string) => Promise<void>;
  recallTicket: () => void;
  addStaff: (staff: Omit<Staff, 'id'>) => Promise<void>;
  updateStaff: (staff: Staff) => Promise<void>;
  deleteStaff: (staffId: string) => Promise<void>;
  addCounter: (counter: Omit<Counter, 'id' | 'docId'>) => Promise<void>;
  updateCounter: (counter: Counter) => Promise<void>;
  deleteCounter: (counterDocId: string) => Promise<void>;
  addService: (service: Omit<Service, 'id' | 'icon'> & { id: string }) => Promise<void>;
  updateService: (service: Omit<Service, 'icon'>) => Promise<void>;
  deleteService: (serviceId: string) => Promise<void>;
}

const QueueContext = createContext<QueueContextType | undefined>(undefined);

const enrichTickets = (tickets: Ticket[], services: Service[]): Ticket[] => {
    return tickets.map(ticket => ({
        ...ticket,
        service: services.find(s => s.id === ticket.serviceId) || { id: ticket.serviceId, name: 'Unknown Service' }
    }));
};


export const QueueProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<QueueState>({
    tickets: [],
    servingHistory: [],
    nowServing: null,
    counters: [],
    services: [],
    staff: [],
    currentUser: null,
  });
  const { toast } = useToast();

  const loginUser = (user: User) => {
    if (user && user.uid && user.email && user.role) {
      setState(prevState => ({ ...prevState, currentUser: user }));
    } else {
      console.error("Attempted to log in with invalid user object:", user);
    }
  };

  const logoutUser = () => {
    setState(prevState => ({ ...prevState, currentUser: null }));
  };


  // Subscribe to Services
  useEffect(() => {
    const q = query(collection(db, 'services'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const services: Service[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        services.push({ id: doc.id, name: data.name } as Service);
      });
      setState(prevState => ({...prevState, services}));
    }, (error) => {
      console.error("Error fetching services:", error);
    });
    return () => unsubscribe();
  }, []);

  // Subscribe to Counters
  useEffect(() => {
    const q = query(collection(db, 'counters'), orderBy('id'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const counters: Counter[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        counters.push({ docId: doc.id, id: data.id, name: data.name, status: data.status });
      });
      setState(prevState => ({...prevState, counters}));
    }, (error) => {
      console.error("Error fetching counters:", error);
    });
    return () => unsubscribe();
  }, []);

  // Subscribe to Staff
  useEffect(() => {
    const q = query(collection(db, 'staff'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const staff: Staff[] = [];
      querySnapshot.forEach((doc) => {
        staff.push({ id: doc.id, ...doc.data() } as Staff);
      });
      setState(prevState => ({...prevState, staff}));
    }, (error) => {
      console.error("Error fetching staff:", error);
    });
    return () => unsubscribe();
  }, []);

  // Subscribe to Tickets
  useEffect(() => {
    if (state.services.length === 0) return; // Wait for services to load
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const q = query(collection(db, 'tickets'), where('timestamp', '>=', today), orderBy('timestamp'));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const tickets: Ticket[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data() as TicketDoc;
        tickets.push({ 
            id: doc.id, 
            serviceId: data.serviceId,
            timestamp: data.timestamp.toDate(),
            ...data
        } as Ticket);
      });
      setState(prevState => ({...prevState, tickets: enrichTickets(tickets, prevState.services)}));
    }, (error) => {
      console.error("Error fetching tickets:", error);
    });
    return () => unsubscribe();
  }, [state.services]);

  // Subscribe to Now Serving
  useEffect(() => {
    if (state.tickets.length === 0) { // If no tickets, there's nothing to serve
        if(state.nowServing !== null) {
            setState(prevState => ({ ...prevState, nowServing: null }));
        }
        return;
    };
  
    const q = query(collection(db, 'nowServing'), limit(1));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      if (querySnapshot.empty) {
        setState(prevState => ({ ...prevState, nowServing: null }));
        return;
      }
      const nowServingDoc = querySnapshot.docs[0].data() as NowServingDoc;
      const servingTicket = state.tickets.find(t => t.id === nowServingDoc.ticketId);

      if (servingTicket) {
        const nowServing: ServingInfo = { ticket: servingTicket, counter: nowServingDoc.counter };
        setState(prevState => {
            const history = [nowServing, ...(prevState.servingHistory || [])].filter((v,i,a)=>a.findIndex(t=>(t.ticket.id === v.ticket.id))===i).slice(0,5);
            return { ...prevState, nowServing, servingHistory: history };
        });
      } else {
         // Ticket is not in today's list, maybe it's from yesterday, clear nowServing
         setState(prevState => ({ ...prevState, nowServing: null }));
      }
    }, (error) => {
      console.error("Error fetching nowServing:", error);
    });
    return () => unsubscribe();
  }, [state.tickets]);


  const addTicket = async (service: Service): Promise<Ticket | null> => {
    try {
        const todayStr = new Date().toISOString().split('T')[0]; // e.g., "2024-01-01"
        const counterRef = doc(db, 'counters_daily', `${service.id}_${todayStr}`);
        
        let newTicketData: Ticket | null = null;

        await runTransaction(db, async (transaction) => {
            const counterDoc = await transaction.get(counterRef);
            
            let newCount = 1;
            if (counterDoc.exists()) {
                newCount = counterDoc.data().count + 1;
            } else {
                transaction.set(counterRef, { count: 1 });
            }

            const newTicketNumber = `${service.id}-${String(newCount).padStart(3, '0')}`;
            
            const newTicketRef = doc(collection(db, 'tickets'));
            transaction.set(newTicketRef, {
                number: newTicketNumber,
                serviceId: service.id,
                timestamp: serverTimestamp(),
                status: 'waiting',
            });
            transaction.update(counterRef, { count: newCount });

            newTicketData = {
                id: newTicketRef.id,
                number: newTicketNumber,
                service: service,
                serviceId: service.id,
                timestamp: new Date(),
                status: 'waiting'
            };
        });

        if (newTicketData) {
            const finalTicketData = newTicketData as Ticket;
            toast({ title: "Sukses", description: `Tiket ${finalTicketData.number} berhasil dibuat.` });
            setState(prevState => ({
                ...prevState,
                tickets: enrichTickets([...prevState.tickets, finalTicketData], prevState.services)
            }));
        }

        return newTicketData;

    } catch (error) {
        console.error("Error adding ticket: ", error);
        toast({ title: 'Error', description: 'Gagal menambahkan tiket.', variant: 'destructive'});
        return null;
    }
  };

  const callNextTicket = async (serviceId: string, counter: number) => {
    try {
        // Find the next ticket from the local state
        const nextTicket = state.tickets
            .filter(t => t.serviceId === serviceId && t.status === 'waiting')
            .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
            [0];

        if (!nextTicket) {
            toast({ title: 'Info', description: 'Tidak ada antrian untuk layanan ini.'});
            return;
        }

        const batch = writeBatch(db);

        // Update ticket status
        batch.update(doc(db, 'tickets', nextTicket.id), { status: 'serving' });

        // Set nowServing (delete old one first)
        const nowServingSnapshot = await getDocs(collection(db, 'nowServing'));
        nowServingSnapshot.forEach(doc => batch.delete(doc.ref));
        
        const nowServingCol = collection(db, 'nowServing');
        const nowServingRef = doc(nowServingCol); // Create a new document reference
        batch.set(nowServingRef, { ticketId: nextTicket.id, counter });
        
        await batch.commit();
        toast({ title: "Memanggil Antrian", description: `Nomor ${nextTicket.number} dipanggil ke loket ${counter}.`})

    } catch (error) {
        console.error("Error calling next ticket: ", error);
        toast({ title: 'Error', description: 'Gagal memanggil tiket berikutnya.', variant: 'destructive'});
    }
  };
  
  const completeTicket = async (ticketId: string) => {
    try {
        const batch = writeBatch(db);
        // Mark ticket as done
        batch.update(doc(db, 'tickets', ticketId), { status: 'done' });
        
        // Clear nowServing if it's the one being completed
        const nowServingSnapshot = await getDocs(query(collection(db, 'nowServing'), where('ticketId', '==', ticketId)));
        nowServingSnapshot.forEach(doc => batch.delete(doc.ref));

        await batch.commit();
        toast({ title: "Layanan Selesai", description: "Antrian telah selesai dilayani."});

    } catch (error) {
        console.error("Error completing ticket: ", error);
        toast({ title: 'Error', description: 'Gagal menyelesaikan tiket.', variant: 'destructive'});
    }
  };
  
  const recallTicket = () => {
    // This is purely a UI trigger, now handled by useEffect on nowServing change in MonitorPage.
    // If we need to force a re-render or some state change, it can be done here.
    if(state.nowServing) {
        toast({ title: "Panggilan Ulang", description: `Memanggil kembali nomor antrian ${state.nowServing.ticket.number}.`})
        console.log("Recalling ticket:", state.nowServing?.ticket.number);
    }
  };

  // --- Admin Functions ---
  const addStaff = async (staff: Omit<Staff, 'id'>) => {
      await addDoc(collection(db, 'staff'), staff);
  }
  const updateStaff = async (staff: Staff) => {
      const { id, ...data } = staff;
      await updateDoc(doc(db, 'staff', id), data);
  }
  const deleteStaff = async (staffId: string) => {
      await deleteDoc(doc(db, 'staff', staffId));
  }

  const addCounter = async (counter: Omit<Counter, 'id' | 'docId'>) => {
      const q = query(collection(db, 'counters'), orderBy('id', 'desc'), limit(1));
      const lastCounterSnapshot = await getDocs(q);
      const newId = lastCounterSnapshot.empty ? 1 : lastCounterSnapshot.docs[0].data().id + 1;
      await addDoc(collection(db, 'counters'), {...counter, id: newId });
  }
  const updateCounter = async (counter: Counter) => {
      const { docId, ...data } = counter;
      await updateDoc(doc(db, 'counters', docId), data as any);
  }
  const deleteCounter = async (counterDocId: string) => {
      await deleteDoc(doc(db, 'counters', counterDocId));
  }
  
  const addService = async (service: Omit<Service, 'icon' | 'name'> & {id: string, name: string}) => {
      await setDoc(doc(db, 'services', service.id), { name: service.name });
  }
  const updateService = async (service: Omit<Service, 'icon'>) => {
      await updateDoc(doc(db, 'services', service.id), { name: service.name });
  }
  const deleteService = async (serviceId: string) => {
    try {
        const batch = writeBatch(db);
        
        const serviceRef = doc(db, 'services', serviceId);
        batch.delete(serviceRef);

        const todayStr = new Date().toISOString().split('T')[0];
        const dailyCounterRef = doc(db, 'counters_daily', `${serviceId}_${todayStr}`);
        batch.delete(dailyCounterRef); // Also delete today's counter

        await batch.commit();
        toast({ title: "Sukses", description: "Layanan berhasil dihapus." });
    } catch (e) {
        console.error("Failed to delete service and its counters", e);
        toast({ title: "Error", description: "Gagal menghapus layanan.", variant: "destructive" });
    }
  }


  return (
    <QueueContext.Provider value={{ state, loginUser, logoutUser, addTicket, callNextTicket, completeTicket, recallTicket, addStaff, updateStaff, deleteStaff, addCounter, updateCounter, deleteCounter, addService, updateService, deleteService }}>
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
