// Global Store for in-memory data persistence
export const API_URL = 'http://localhost:5005/api';
export const mockSchedules: any[] = [
    { 
        id: '1', 
        route: 'Colombo - Kandy', 
        bus: 'ND-1234', 
        date: '2026-04-22', 
        scheduledDep: '08:00 AM', 
        scheduledArr: '11:00 AM', 
        status: 'On Time',
        isActive: true 
    },
    { 
        id: '2', 
        route: 'Kandy - Colombo', 
        bus: 'NW-9012', 
        date: '2026-04-25', 
        scheduledDep: '02:00 PM', 
        scheduledArr: '05:00 PM', 
        status: 'On Time',
        isActive: true 
    },
];
