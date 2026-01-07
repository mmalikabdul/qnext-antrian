import { useState, useEffect } from 'react';
import { socket } from '@/lib/socket';
import { monitorService } from '../services/monitor.service';
import { Ticket, AppSetting } from '@/types/queue';

export const useMonitorQueue = () => {
  const [servingTickets, setServingTickets] = useState<Ticket[]>([]);
  const [allTodayTickets, setAllTodayTickets] = useState<Ticket[]>([]);
  const [settings, setSettings] = useState<AppSetting | null>(null);
  const [lastCalledTicket, setLastCalledTicket] = useState<Ticket | null>(null);
  const [lastRecallTicket, setLastRecallTicket] = useState<any | null>(null);

  useEffect(() => {
    // Initial fetch
    const fetchData = async () => {
      try {
        const [serving, today, config] = await Promise.all([
          monitorService.getServingTickets(),
          monitorService.getTodayTickets(),
          monitorService.getDisplaySettings()
        ]);
        setServingTickets(serving);
        setAllTodayTickets(today);
        setSettings(config);
      } catch (e) {
        console.error("Failed to fetch monitor data", e);
      }
    };

    fetchData();

    // Setup Socket
    socket.connect();
    
    socket.on("queue-updated", (data: any) => {
      console.log("Queue Update received:", data);
      
      if (data.type === "CALL_TICKET") {
          setLastCalledTicket(data.ticket);
          monitorService.getServingTickets().then(setServingTickets);
          monitorService.getTodayTickets().then(setAllTodayTickets);
      } else if (data.type === "RECALL_TICKET") {
          setLastRecallTicket({ ...data.ticket, _recallId: Date.now() });
      } else if (["NEW_TICKET", "COMPLETE_TICKET", "SKIP_TICKET"].includes(data.type)) {
          monitorService.getServingTickets().then(setServingTickets);
          monitorService.getTodayTickets().then(setAllTodayTickets);
      }
    });

    return () => {
      socket.off("queue-updated");
      socket.disconnect();
    };
  }, []);

  return { servingTickets, allTodayTickets, settings, lastCalledTicket, lastRecallTicket };
};
