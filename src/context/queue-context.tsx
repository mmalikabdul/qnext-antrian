'use client';

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { db, app } from '@/lib/firebase';
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword } from 'firebase/auth';
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
    setDoc,
    getDoc,
} from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

// Interfaces
export interface Service {
  id: string;
  name: string;
  servingCounters: number[];
  icon: string; // Icon name from lucide-react
}

export interface Ticket {
  id: string; // Firestore document ID
  number: string;
  serviceId: string;
  service: Service; // This will be enriched data
  timestamp: Date;
  status: 'waiting' | 'serving' | 'done' | 'skipped';
}

export interface ReportTicket {
  id: string;
  number: string;
  serviceId: string;
  serviceName: string;
  timestamp: Date;
  calledAt?: Date;
  completedAt?: Date;
  status: 'waiting' | 'serving' | 'done' | 'skipped';
  servedBy?: string;
  counter?: number;
}


export interface ServingInfo {
  ticket: Ticket;
  counter: number;
}

export interface RecallInfo {
    ticketId: string;
    timestamp: number;
}

export interface Staff {
  id: string; // Firestore document ID, should be same as User UID
  name: string;
  counters: number[];
}

export interface Counter {
    id: number;
    docId: string; // Firestore document ID
    name: string;
    status: 'open' | 'closed';
}

export interface User {
  uid: string;
  email: string;
  role: 'admin' | 'staff';
  name?: string;
  counters?: number[];
}


// Raw Firestore data types
interface TicketDoc {
    serviceId: string;
    timestamp: Timestamp;
    status: 'waiting' | 'serving' | 'done' | 'skipped';
    number: string;
    calledAt?: Timestamp;
    completedAt?: Timestamp;
    servedBy?: string; // staff name
    counter?: number;
}
interface NowServingDoc {
    ticketId: string;
    counter: number;
    staffId: string;
}
interface ServiceDoc {
    name:string;
    servingCounters: number[];
    icon: string;
}


interface QueueState {
  tickets: Ticket[];
  servingHistory: ServingInfo[];
  nowServing: ServingInfo | null;
  recallInfo: RecallInfo | null;
  counters: Counter[];
  services: Service[];
  staff: Staff[];
  users: User[];
  currentUser: User | null;
  authLoaded: boolean;
  videoUrl: string;
}

interface QueueContextType {
  state: QueueState;
  loginUser: (user: User) => void;
  logoutUser: () => void;
  addTicket: (service: Service) => Promise<Ticket | null>;
  callNextTicket: (serviceId: string, counter: number) => Promise<void>;
  completeTicket: (ticketId: string) => Promise<void>;
  skipTicket: (ticketId: string) => Promise<void>;
  recallTicket: (ticketId: string) => void;
  addStaff: (staffData: any) => Promise<void>;
  updateStaff: (staff: Staff) => Promise<void>;
  deleteStaff: (staffId: string) => Promise<void>;
  addCounter: (counter: Omit<Counter, 'id' | 'docId'>) => Promise<void>;
  updateCounter: (counter: Counter) => Promise<void>;
  deleteCounter: (counterDocId: string) => Promise<void>;
  addService: (service: Omit<Service, 'id'> & { id: string }) => Promise<void>;
  updateService: (service: Service) => Promise<void>;
  deleteService: (serviceId: string) => Promise<void>;
  updateVideoUrl: (url: string) => Promise<void>;
  getReportData: (startDate: Date, endDate: Date) => Promise<ReportTicket[]>;
}

const QueueContext = createContext<QueueContextType | undefined>(undefined);

const enrichTickets = (tickets: Ticket[], services: Service[]): Ticket[] => {
    return tickets.map(ticket => ({
        ...ticket,
        service: services.find(s => s.id === ticket.serviceId) || { id: ticket.serviceId, name: 'Layanan tidak diketahui', servingCounters: [], icon: 'Ticket' }
    }));
};


export const QueueProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<QueueState>({
    tickets: [],
    servingHistory: [],
    nowServing: null,
    recallInfo: null,
    counters: [],
    services: [],
    staff: [],
    users: [],
    currentUser: null,
    authLoaded: false,
    videoUrl: 'https://www.youtube.com/embed/videoseries?list=PL2_3w_50q_p_4i_t_aA-i1l_n5s-ZqGcB'
  });
  const { toast } = useToast();
  const auth = getAuth(app);
  
  // Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
            // Check if this user object is already the current user to avoid redundant fetches
            if (state.currentUser && user.uid === state.currentUser.uid) {
                setState(prevState => ({...prevState, authLoaded: true}));

                return;
            }

            const userDocRef = doc(db, 'users', user.uid);
            let userDocSnap = await getDoc(userDocRef);

            // Add retry mechanism in case Firestore write is delayed
            const maxRetries = 5;
            const retryDelayMs = 200;
            let retries = 0;

            while (!userDocSnap.exists() && retries < maxRetries) {
                console.log(`User document not found for ${user.uid}, retrying... Attempt ${retries + 1}/${maxRetries}`);
                await new Promise(resolve => setTimeout(resolve, retryDelayMs));
                userDocSnap = await getDoc(userDocRef);
                retries++;
            }

            if (userDocSnap.exists()) {
                const userData = userDocSnap.data() as Omit<User, 'uid'>;

                const staffDocRef = doc(db, 'staff', user.uid);
                let staffDocSnap = await getDoc(staffDocRef);

                // Add retry mechanism for staff doc as well
                retries = 0; // Reset retries for staff doc
                while (userData.role === 'staff' && !staffDocSnap.exists() && retries < maxRetries) {
                    console.log(`Staff document not found for ${user.uid}, retrying... Attempt ${retries + 1}/${maxRetries}`);
                    await new Promise(resolve => setTimeout(resolve, retryDelayMs));
                    staffDocSnap = await getDoc(staffDocRef);
                    retries++;
                }

                const staffData = staffDocSnap.exists() ? staffDocSnap.data() as Omit<Staff, 'id'> : { name: userData.email, counters: [] };

                setState(prevState => ({ ...prevState, currentUser: { uid: user.uid, ...userData, ...staffData }, authLoaded: true }));
            } else {
                 setState(prevState => ({ ...prevState, currentUser: null, authLoaded: true }));
            }
        } else {
            setState(prevState => ({ ...prevState, currentUser: null, authLoaded: true }));
        }
    });
    return () => unsubscribe();
  }, [auth, state.currentUser]);


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
        const data = doc.data() as ServiceDoc;
        services.push({ id: doc.id, ...data } as Service);
      });
      setState(prevState => ({...prevState, services}));
    }, (error) => {
      console.error("Error fetching services:", error);
    });
    return () => unsubscribe();
  }, []);
  
  // Subscribe to Users
  useEffect(() => {
    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const users: User[] = [];
        querySnapshot.forEach((doc) => {
            users.push({ uid: doc.id, name: doc.data().name, ...doc.data() } as User);
        });
        setState(prevState => ({...prevState, users}));
    }, (error) => console.error("Error fetching users:", error));
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
  
  // Subscribe to Settings (for video URL)
  useEffect(() => {
    const settingsRef = doc(db, 'settings', 'display');
    const unsubscribe = onSnapshot(settingsRef, (doc) => {
        if (doc.exists()) {
            const data = doc.data();
            if (data.videoUrl) {
                setState(prevState => ({...prevState, videoUrl: data.videoUrl }));
            }
        }
    }, (error) => {
        console.error("Error fetching settings:", error);
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
    if (state.services.length === 0) return;
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
            number: data.number,
            status: data.status,
            service: {} as Service
        });
      });
      setState(prevState => ({...prevState, tickets: enrichTickets(tickets, prevState.services)}));
    }, (error) => {
      console.error("Error fetching tickets:", error);
    });
    return () => unsubscribe();
  }, [state.services]);

  // Subscribe to Now Serving
  useEffect(() => {
    if (state.tickets.length === 0 && state.nowServing !== null) {
        // Clear nowServing if there are no tickets at all
        setState(prevState => ({ ...prevState, nowServing: null }));
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
         // This can happen if the ticket was just completed/deleted
         setState(prevState => ({ ...prevState, nowServing: null }));
      }
    }, (error) => {
      console.error("Error fetching nowServing:", error);
    });
    return () => unsubscribe();
  }, [state.tickets]); // Rerun when tickets change


  const addTicket = async (service: Service): Promise<Ticket | null> => {
    try {
        const todayStr = new Date().toISOString().split('T')[0];
        const counterRef = doc(db, 'daily_counters', `${service.id}_${todayStr}`);
        
        let newTicketData: Ticket | null = null;

        await runTransaction(db, async (transaction) => {
            const counterDoc = await transaction.get(counterRef);
            
            let newCount = 1;
            if (counterDoc.exists()) {
                newCount = counterDoc.data().count + 1;
            }

            const newTicketNumber = `${service.id}-${String(newCount).padStart(3, '0')}`;
            
            const newTicketRef = doc(collection(db, 'tickets'));
            transaction.set(newTicketRef, {
                number: newTicketNumber,
                serviceId: service.id,
                timestamp: serverTimestamp(),
                status: 'waiting',
            });
            transaction.set(counterRef, { count: newCount }, { merge: true });

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
             toast({ variant: "success", title: "Sukses", description: `Tiket ${newTicketData.number} berhasil dibuat.` });
        }
        return newTicketData;

    } catch (error) {
        console.error("Error adding ticket: ", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Gagal menambahkan tiket.'});
        return null;
    }
  };

  const callNextTicket = async (serviceId: string, counter: number) => {
    try {
      if (!state.currentUser) throw new Error("User not authenticated");

      const waitingTickets = state.tickets.filter(t => t.serviceId === serviceId && t.status === 'waiting');
      
      if (waitingTickets.length === 0) {
        toast({ variant: 'warning', title: 'Info', description: 'Tidak ada antrian untuk layanan ini.'});
        return;
      }
      
      const nextTicket = waitingTickets.sort((a,b) => a.timestamp.getTime() - b.timestamp.getTime())[0];

      const batch = writeBatch(db);
      const ticketRef = doc(db, 'tickets', nextTicket.id);
      batch.update(ticketRef, { 
          status: 'serving',
          calledAt: serverTimestamp(),
          servedBy: state.currentUser.name,
          counter,
      });

      const nowServingSnapshot = await getDocs(collection(db, 'nowServing'));
      nowServingSnapshot.forEach(doc => batch.delete(doc.ref));
      
      const nowServingCol = collection(db, 'nowServing');
      const nowServingRef = doc(nowServingCol);
      batch.set(nowServingRef, { 
          ticketId: nextTicket.id, 
          counter, 
          staffId: state.currentUser.uid 
        });
      
      await batch.commit();
      toast({ title: "Memanggil Antrian", description: `Nomor ${nextTicket.number} dipanggil ke loket ${counter}.`})

    } catch (error) {
        console.error("Error calling next ticket: ", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Gagal memanggil tiket berikutnya.'});
    }
  };

  const clearServingAndRecall = async () => {
    const batch = writeBatch(db);
    const nowServingSnapshot = await getDocs(collection(db, 'nowServing'));
    nowServingSnapshot.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    setState(prevState => ({ ...prevState, nowServing: null, recallInfo: null }));
  };
  
  const completeTicket = async (ticketId: string) => {
    try {
        await updateDoc(doc(db, 'tickets', ticketId), { 
            status: 'done',
            completedAt: serverTimestamp()
        });
        await clearServingAndRecall();
        toast({ variant: "success", title: "Layanan Selesai", description: "Antrian telah selesai dilayani."});

    } catch (error) {
        console.error("Error completing ticket: ", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Gagal menyelesaikan tiket.'});
    }
  };

  const skipTicket = async (ticketId: string) => {
    try {
        await updateDoc(doc(db, 'tickets', ticketId), { status: 'skipped' });
        await clearServingAndRecall();
        toast({ variant: "warning", title: "Antrian Dilewati", description: "Antrian telah ditandai sebagai dilewati."});

    } catch (error) {
        console.error("Error skipping ticket: ", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Gagal melewati tiket.'});
    }
  };
  
  const recallTicket = (ticketId: string) => {
    setState(prevState => ({...prevState, recallInfo: { ticketId, timestamp: Date.now() }}))
    console.log("Recalling ticket:", ticketId);
  };

  // --- Admin Functions ---
  const addStaff = async (userData: any) => {
    const { email, password, name, role, counters } = userData;
    try {
        const newUserCredential = await createUserWithEmailAndPassword(auth, email, password);
        const newUser = newUserCredential.user;

        const batch = writeBatch(db);
        const userDocRef = doc(db, 'users', newUser.uid);
        batch.set(userDocRef, { name, email, role });
        
        if (role === 'staff') {
            const staffDocRef = doc(db, 'staff', newUser.uid);
            batch.set(staffDocRef, { name, counters: counters || [] });
        }
        
        await batch.commit();
        
    } catch (error: any) {
        console.error("Error in addStaff:", error);
        throw error;
    }
  }

  const updateStaff = async (staff: Staff) => {
      const { id, ...data } = staff;
      await updateDoc(doc(db, 'staff', id), data);
      const userDocRef = doc(db, 'users', id);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
          await updateDoc(userDocRef, { name: data.name });
      }
  }

  const deleteStaff = async (staffId: string) => {
      try {
        const batch = writeBatch(db);
        batch.delete(doc(db, 'staff', staffId));
        batch.delete(doc(db, 'users', staffId));
        await batch.commit();
        console.warn(`User with UID ${staffId} deleted from Firestore, but not from Firebase Auth.`);
      } catch (error: any) {
        throw new Error(`Gagal menghapus data pengguna dari database: ${error.message}`);
      }
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
  
  const addService = async (service: Omit<Service, 'id'> & { id: string }) => {
      await setDoc(doc(db, 'services', service.id), { 
          name: service.name, 
          servingCounters: service.servingCounters || [],
          icon: service.icon || 'Ticket' 
      });
  }

  const updateService = async (service: Service) => {
      await updateDoc(doc(db, 'services', service.id), { 
          name: service.name, 
          servingCounters: service.servingCounters || [],
          icon: service.icon || 'Ticket'
      });
  }

  const deleteService = async (serviceId: string) => {
    try {
        const batch = writeBatch(db);
        
        const serviceRef = doc(db, 'services', serviceId);
        batch.delete(serviceRef);

        const todayStr = new Date().toISOString().split('T')[0];
        const dailyCounterRef = doc(db, 'daily_counters', `${serviceId}_${todayStr}`);
        const dailyCounterSnap = await getDoc(dailyCounterRef);
        if (dailyCounterSnap.exists()){
            batch.delete(dailyCounterRef);
        }

        await batch.commit();
        toast({ variant: "success", title: "Sukses", description: "Layanan berhasil dihapus." });
    } catch (e) {
        console.error("Failed to delete service and its counters", e);
        toast({ variant: "destructive", title: "Error", description: "Gagal menghapus layanan." });
        throw e;
    }
  }
  
  const updateVideoUrl = async (url: string) => {
    const settingsRef = doc(db, 'settings', 'display');
    await setDoc(settingsRef, { videoUrl: url }, { merge: true });
  }

  const getReportData = async (startDate: Date, endDate: Date): Promise<ReportTicket[]> => {
    const startOfDay = new Date(startDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(endDate);
    endOfDay.setHours(23, 59, 59, 999);

    const q = query(
        collection(db, 'tickets'), 
        where('timestamp', '>=', startOfDay), 
        where('timestamp', '<=', endOfDay),
        orderBy('timestamp', 'asc')
    );

    const querySnapshot = await getDocs(q);
    const reportTickets: ReportTicket[] = [];

    querySnapshot.forEach(docSnap => {
        const data = docSnap.data() as TicketDoc;
        const service = state.services.find(s => s.id === data.serviceId);
        reportTickets.push({
            id: docSnap.id,
            number: data.number,
            serviceId: data.serviceId,
            serviceName: service?.name || 'Unknown',
            timestamp: data.timestamp.toDate(),
            calledAt: data.calledAt?.toDate(),
            completedAt: data.completedAt?.toDate(),
            status: data.status,
            servedBy: data.servedBy,
            counter: data.counter,
        });
    });

    return reportTickets;
  }


  return (
    <QueueContext.Provider value={{ state, loginUser, logoutUser, addTicket, callNextTicket, completeTicket, skipTicket, recallTicket, addStaff, updateStaff, deleteStaff, addCounter, updateCounter, deleteCounter, addService, updateService, deleteService, updateVideoUrl, getReportData }}>
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
