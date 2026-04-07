import dotenv from "dotenv";
dotenv.config();

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import path from "path";
import http from "http";
import { Server } from "socket.io";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
  },
});

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
  });
});

const emitMaintenanceUpdate = (vehicleId) => {
  io.emit('maintenanceUpdate', { vehicleId });
};

const emitIssueCreated = (vehicleId, issue) => {
  io.emit('issueCreated', { vehicleId, issue });
};

const emitIssueUpdated = (vehicleId, issue) => {
  io.emit('issueUpdated', { vehicleId, issue });
};

const emitSOSUpdated = (sos) => {
  io.emit('sosUpdated', sos);
};

const emitSOSCreated = (sos) => {
  io.emit('sosCreated', sos);
};

const emitAlertCreated = (alert) => {
  io.emit('sosAlertCreated', alert);
};

const emitAlertUpdated = (alert) => {
  io.emit('sosAlertUpdated', alert);
};

const clearSosTimer = (sosId) => {
  const key = String(sosId);
  const existingTimer = sosTimers.get(key);
  if (existingTimer) {
    clearTimeout(existingTimer);
    sosTimers.delete(key);
  }
};

const sosTimers = new Map();

const triggerSOSAlert = async (sos) => {
  if (!sos || sos.status !== 'pending') return;

  const message = `Emergency Alert: Bus ${sos.busId} requires attention`;
  const contacts = await EmergencyContact.find({}).lean();
  
  // Find extra info for the alert
  const reportingUser = await User.findOne({ 
    $or: [
      { phone: sos.driverId },
      { username: sos.driverId }
    ]
  });
  const vehicle = await Vehicle.findOne({ vehicleId: sos.busId });

  const formattedContacts = contacts.map((contact) => ({
    name: contact.name,
    phone: contact.phone,
    email: contact.email || '',
    bloodGroup: contact.bloodGroup || '',
  }));
  const existingAlert = sos.alertId ? await SOSAlert.findById(sos.alertId) : null;

  const alert = existingAlert || new SOSAlert({
    busId: sos.busId,
    sosId: sos._id,
    driverId: sos.driverId,
    userName: reportingUser?.name || 'Unknown User',
    userPhone: reportingUser?.phone || sos.driverId,
    busNumber: vehicle?.busNumber || sos.busId,
    busModel: vehicle?.model || 'Public Transport Bus',
    message,
    status: 'pending',
    emergencyContacts: formattedContacts,
  });

  if (existingAlert) {
    alert.emergencyContacts = formattedContacts;
    await alert.save();
  } else {
    await alert.save();
  }

  sos.status = 'alerted';
  sos.alertTriggeredAt = new Date();
  sos.alertId = alert._id;
  sos.updatedAt = new Date();
  await sos.save();

  const incident = new MaintenanceIssue({
    vehicleId: sos.busId,
    type: 'SOS Emergency',
    location: sos.location || 'Unknown location',
    description: sos.details || `SOS triggered by driver ${sos.driverId}`,
    priority: 'high',
    assignedTo: null,
    reporter: sos.driverId,
    reporterName: reportingUser?.name || 'Unknown Driver',
    reporterPhone: reportingUser?.phone || sos.driverId || '0771319366',
    incidentStatus: 'pending',
    history: [
      {
        status: 'pending',
        actor: 'System',
        actorRole: 'system',
        comment: 'SOS auto incident created',
        date: new Date(),
      },
    ],
  });
  await incident.save();

  sos.incidentId = incident._id;
  await sos.save();

  // Simulate admin response - update to in_progress after 30 seconds
  setTimeout(async () => {
    try {
      const freshIncident = await MaintenanceIssue.findById(incident._id);
      if (freshIncident && freshIncident.incidentStatus === 'pending') {
        freshIncident.incidentStatus = 'in_progress';
        freshIncident.history.push({
          status: 'in_progress',
          actor: 'System',
          actorRole: 'system',
          comment: 'Admin assigned and responding to SOS',
          date: new Date(),
        });
        await freshIncident.save();
        emitIssueUpdated(freshIncident.vehicleId, freshIncident);
      }
    } catch (err) {
      console.error('Error updating SOS incident status:', err);
    }
  }, 30000); // 30 seconds

  // Simulate resolution after 2 minutes
  setTimeout(async () => {
    try {
      const freshIncident = await MaintenanceIssue.findById(incident._id);
      if (freshIncident && freshIncident.incidentStatus === 'in_progress') {
        freshIncident.incidentStatus = 'resolved';
        freshIncident.history.push({
          status: 'resolved',
          actor: 'System',
          actorRole: 'system',
          comment: 'SOS incident resolved - emergency assistance provided',
          date: new Date(),
        });
        await freshIncident.save();
        
        // Reset vehicle status
        if (vehicle && vehicle.maintenanceStatus === 'emergency') {
          vehicle.active = true;
          vehicle.maintenanceStatus = 'ready';
          await updateVehicleMaintenanceStatus(vehicle);
        }
        
        emitIssueUpdated(freshIncident.vehicleId, freshIncident);
      }
    } catch (err) {
      console.error('Error resolving SOS incident:', err);
    }
  }, 120000); // 2 minutes

  // Transition vehicle to emergency status
  if (vehicle) {
    vehicle.active = false;
    vehicle.maintenanceStatus = 'emergency';
    vehicle.logs.push({
      title: 'SOS alert triggered',
      detail: `SOS triggered by user ${reportingUser?.name || sos.driverId}`,
      date: new Date(),
    });
    await updateVehicleMaintenanceStatus(vehicle);
  }

  emitAlertCreated(alert);
  emitIssueCreated(sos.busId, incident);
  emitSOSUpdated(sos);
};

const scheduleSOSAlert = async (sos) => {
  const delay = 5 * 60 * 1000;
  const expiration = new Date(sos.createdAt.getTime() + delay).getTime();
  const remaining = expiration - Date.now();

  if (remaining <= 0) {
    await triggerSOSAlert(sos);
    return;
  }

  if (sosTimers.has(String(sos._id))) {
    clearTimeout(sosTimers.get(String(sos._id)));
  }

  const timer = setTimeout(async () => {
    sosTimers.delete(String(sos._id));
    const freshSOS = await SOSRequest.findById(sos._id);
    if (freshSOS && freshSOS.status === 'pending') {
      await triggerSOSAlert(freshSOS);
    }
  }, remaining);

  sosTimers.set(String(sos._id), timer);
};

const resumePendingSOS = async () => {
  const pendingSOS = await SOSRequest.find({ status: 'pending' });
  pendingSOS.forEach((sos) => scheduleSOSAlert(sos));
};

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id', 'x-user-role', 'x-user-phone', 'x-user-name'],
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// =====================
// MongoDB Connection
// =====================
const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/intercityDB";

mongoose.connect(mongoUri)
  .then(async () => {
    console.log(`MongoDB Connected ✅ (${mongoUri.startsWith('mongodb+srv') ? 'Atlas' : 'Local'})`);
    await seedDefaultAdmin();
    await seedSampleVehicle();
    await resumePendingSOS();
  })
  .catch((err) => console.log(err));

// =====================
// Allowed roles
// =====================
const ROLE_SUPER_ADMIN = 'super-admin';
const ROLE_ADMIN = 'admin';
const ROLE_MANAGER = 'manager';
const ROLE_STAFF = 'staff';
const USER_ROLES = ['passenger', 'driver', ROLE_STAFF, ROLE_MANAGER, ROLE_ADMIN, ROLE_SUPER_ADMIN];
const ADMIN_ROLES = [ROLE_SUPER_ADMIN, ROLE_ADMIN, ROLE_MANAGER, ROLE_STAFF];

const parseAuthorizationRole = (authHeader) => {
  if (!authHeader) return null;
  const token = authHeader.replace(/^(Bearer|Token)\s+/i, '').trim();
  if (!token) return null;
  const allowedRoles = [...USER_ROLES, ...ADMIN_ROLES];
  if (allowedRoles.includes(token)) return token;
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf8'));
    if (decoded?.role && allowedRoles.includes(decoded.role)) {
      return decoded.role;
    }
  } catch (_error) {
    return null;
  }
  return null;
};

const getActorRole = (req) => {
  return req.get('x-user-role') || parseAuthorizationRole(req.get('authorization')) || req.body.performerRole || req.query.performerRole;
};

const requireAuth = async (req, res, next) => {
  try {
    const actorRole = getActorRole(req);
    if (!actorRole) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    req.actorRole = actorRole;

    console.log('[Auth] Incoming headers:', {
      'x-user-id': req.get('x-user-id'),
      'x-user-role': req.get('x-user-role'),
      'x-user-name': req.get('x-user-name'),
      'x-user-phone': req.get('x-user-phone')
    });

    const userId = req.get('x-user-id');
    const userPhone = req.get('x-user-phone');
    const username = req.get('x-user-name');

    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      req.user = await User.findById(userId);
    } else if (username) {
      req.user = await User.findOne({ username });
    } else if (userPhone) {
      req.user = await User.findOne({ phone: userPhone });
    }

    if (req.user) {
      console.log(`[Auth] Identified user: ${req.user.name} (${req.user.role}) via ${userPhone ? 'phone' : (username ? 'username' : 'id')}`);
    } else {
      console.warn(`[Auth] User not found for ID: ${userId}, Phone: ${userPhone}, Username: ${username}`);
    }
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    next();
  }
};

const requireRole = (...allowedRoles) => (req, res, next) => {
  const actorRole = req.actorRole || getActorRole(req);
  if (!allowedRoles.includes(actorRole)) {
    return res.status(403).json({ message: 'Access denied' });
  }
  req.actorRole = actorRole;
  next();
};

// =====================
// User Schema
// =====================
const userSchema = new mongoose.Schema({
  name: String,
  phone: { type: String, unique: true, sparse: true },
  username: { type: String, unique: true, sparse: true },
  email: String,
  password: String,
  role: { type: String, enum: USER_ROLES, default: 'passenger' },
  assignedVehicle: { type: String },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  isActive: { type: Boolean, default: true },
  adminType: String,
  adminRole: { type: String, enum: ADMIN_ROLES },
  bloodGroup: String,
  emergencyContacts: [
    {
      name: String,
      relationship: String,
      phone: String,
    },
  ],
  profileImage: String,
  updatedAt: { type: Date, default: Date.now },
});

const emergencyContactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, default: '' },
  bloodGroup: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const maintenanceTaskSchema = new mongoose.Schema({
  title: String,
  description: String,
  type: String,
  dueInKm: Number,
  dueDate: Date,
  status: { type: String, enum: ['pending', 'completed'], default: 'pending' },
  priority: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
  completedAt: Date,
  cost: Number,
  technician: String,
  reporterName: String,
  reporterPhone: String,
  busNumber: String,
  vehicleId: String,
  incidentId: String,
  date: { type: Date, default: Date.now },
});



const issueSchema = new mongoose.Schema({
  vehicleId: String,
  type: String,
  location: String,
  description: String,
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reporter: String,
  reporterName: String,
  reporterPhone: String,
  incidentStatus: { type: String, enum: ['pending', 'reported', 'assigned', 'acknowledged', 'in_progress', 'resolved', 'closed'], default: 'reported' },
  history: [
    {
      status: String,
      actor: String,
      actorRole: String,
      comment: String,
      date: { type: Date, default: Date.now },
    },
  ],
  comments: [
    {
      actor: String,
      actorRole: String,
      comment: String,
      date: { type: Date, default: Date.now },
    }
  ],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const sosRequestSchema = new mongoose.Schema({
  busId: String,
  driverId: String,
  location: String,
  details: String,
  status: { type: String, enum: ['pending', 'alerted', 'resolved', 'cancelled'], default: 'pending' },
  alertId: { type: mongoose.Schema.Types.ObjectId, ref: 'SOSAlert' },
  incidentId: { type: mongoose.Schema.Types.ObjectId, ref: 'MaintenanceIssue' },
  alertTriggeredAt: Date,
  resolvedAt: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const sosAlertSchema = new mongoose.Schema({
  busId: String,
  sosId: { type: mongoose.Schema.Types.ObjectId, ref: 'SOSRequest' },
  driverId: String,
  userName: String,
  userPhone: String,
  busNumber: String,
  busModel: String,
  time: { type: Date, default: Date.now },
  message: String,
  status: { type: String, enum: ['pending', 'acknowledged', 'resolved'], default: 'pending' },
  isRead: { type: Boolean, default: false },
  incidentId: { type: mongoose.Schema.Types.ObjectId, ref: 'MaintenanceIssue' },
  firstActionAt: Date,
  responseTimeSeconds: Number,
  forwards: [
    {
      department: { type: String, enum: ['maintenance', 'emergency', 'management'] },
      message: String,
      sender: String,
      senderRole: String,
      createdAt: { type: Date, default: Date.now },
    },
  ],
  emergencyContacts: [
    {
      name: String,
      phone: String,
      email: String,
      createdBy: String,
      bloodGroup: String,
    },
  ],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const EmergencyContact = mongoose.model('EmergencyContact', emergencyContactSchema);

const vehicleSchema = new mongoose.Schema({
  vehicleId: { type: String, unique: true },
  busNumber: String,
  model: String,
  year: Number,
  active: Boolean,
  maintenanceStatus: { type: String, enum: ['ready', 'not_ready', 'under_maintenance', 'emergency'], default: 'ready' },
  riskScore: { type: Number, default: 0 },
  riskLevel: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
  suggestedAction: String,
  lastServiceDate: Date,
  nextServiceDate: Date,
  maintenanceNotes: String,
  technician: String,
  fuelLevel: Number,
  engineHealth: Number,
  coolantTemp: Number,
  batteryVoltage: Number,
  insuranceExpiry: Date,
  licenseExpiry: Date,
  currentMileage: Number,
  nextServiceKm: Number,
  tasks: [maintenanceTaskSchema],
  logs: [
    {
      title: String,
      detail: String,
      date: Date,
    },
  ],
  updatedAt: { type: Date, default: Date.now },
});

const User = mongoose.model("User", userSchema);
const Vehicle = mongoose.model("Vehicle", vehicleSchema);
const MaintenanceIssue = mongoose.model("MaintenanceIssue", issueSchema);
const SOSRequest = mongoose.model("SOSRequest", sosRequestSchema);
const SOSAlert = mongoose.model("SOSAlert", sosAlertSchema);

const BUS_MODELS = [
  'Ashok Leyland Viking',
  'Tata Marcopolo',
  'Lanka Ashok Leyland',
  'Mercedes-Benz Citaro',
  'Volvo 9400 B11R',
  'Scania Touring'
];

const seedDriverBus = async (busId, driverName) => {
  const existing = await Vehicle.findOne({ vehicleId: busId });
  if (existing) return existing;

  const suffix = busId.split('-')[1] || Math.floor(1000 + Math.random() * 9000);
  const newBus = new Vehicle({
    vehicleId: busId,
    busNumber: `NB-${suffix}`,
    model: BUS_MODELS[Math.floor(Math.random() * BUS_MODELS.length)],
    year: 2020 + Math.floor(Math.random() * 5),
    active: true,
    maintenanceStatus: 'ready',
    fuelLevel: 60 + Math.floor(Math.random() * 30),
    engineHealth: 85 + Math.floor(Math.random() * 10),
    coolantTemp: 88 + Math.floor(Math.random() * 8),
    batteryVoltage: 12.4 + (Math.random() * 0.4),
    currentMileage: 45000 + Math.floor(Math.random() * 100000),
    nextServiceKm: 46000 + Math.floor(Math.random() * 100000),
    logs: [{ title: 'Vehicle commissioned', detail: `Newly assigned to driver ${driverName}`, date: new Date() }]
  });
  return await newBus.save();
};

const sampleVehicleData = {
  vehicleId: 'bus-8824',
  busNumber: '8824',
  model: 'Mercedes-Benz Citaro',
  year: 2022,
  active: true,
  maintenanceStatus: 'ready',
  lastServiceDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  nextServiceDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
  maintenanceNotes: 'Next service due after 500 km or 60 days.',
  technician: 'Ahmad Silva',
  fuelLevel: 68,
  engineHealth: 85,
  coolantTemp: 92,
  batteryVoltage: 12.6,
  insuranceExpiry: new Date(Date.now() + 260 * 24 * 60 * 60 * 1000),
  licenseExpiry: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
  currentMileage: 152340,
  nextServiceKm: 152840,
  tasks: [
    {
      title: 'Oil Change',
      description: 'Engine performance optimization required.',
      type: 'oil',
      dueInKm: 500,
      status: 'pending',
      priority: 'high',
    },
    {
      title: 'Tire Rotation',
      description: 'Standard safety check & rotation.',
      type: 'tire',
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      status: 'pending',
      priority: 'medium',

    },
  ],
  logs: [
    { title: 'Brake Pad Replacement', detail: 'Service Center B', date: new Date('2023-10-12') },
    { title: 'Wiper Blade Swap', detail: 'Self Maintenance', date: new Date('2023-09-28') },
    { title: 'Air Filter Cleaning', detail: 'Annual Checkup', date: new Date('2023-09-15') },
  ],
};

const seedDefaultAdmin = async () => {
  try {
    const defaultUsers = [
      {
        name: 'Admin',
        username: 'ADMIN',
        phone: '0770000001',
        password: 'superadmin123',
        role: 'super-admin',
        status: 'active',
        isActive: true,
        adminType: 'user-management',
        adminRole: 'super-admin',
      },
      {
        name: 'Manager',
        username: 'admin',
        phone: '0770000000',
        password: 'admin12345',
        role: 'admin',
        status: 'active',
        isActive: true,
        adminType: 'user-management',
        adminRole: 'admin',
      },
      {
        name: 'Staff',
        username: 'staff',
        phone: '0770000002',
        password: 'staff12345',
        role: 'staff',
        status: 'active',
        isActive: true,
        adminType: 'user-management',
        adminRole: 'staff',
      },
    ];

    for (const userData of defaultUsers) {
      const existingUser = await User.findOne({
        $or: [
          { username: userData.username },
          { phone: userData.phone },
        ],
      });

      if (!existingUser) {
        await new User(userData).save();
        console.log(`Default ${userData.role} account seeded ✅`);
      } else {
        let updated = false;
        const updateFields = ['name', 'username', 'phone', 'role', 'adminType', 'adminRole', 'status', 'isActive'];
        updateFields.forEach((key) => {
          if (existingUser[key] !== userData[key]) {
            existingUser[key] = userData[key];
            updated = true;
          }
        });
        if (updated) {
          await existingUser.save();
          console.log(`Existing ${userData.role} account updated to default credentials ✅`);
        } else {
          console.log(`Default ${userData.role} account already exists.`);
        }
      }
    }
  } catch (error) {
    console.error('Default admin seed error:', error);
  }
};

const seedSampleVehicle = async () => {
  try {
    await Vehicle.findOneAndUpdate(
      { vehicleId: sampleVehicleData.vehicleId },
      sampleVehicleData,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log('Sample vehicle seeded ✅');
  } catch (error) {
    console.error('Sample vehicle seed error:', error);
  }
};

const auditLogSchema = new mongoose.Schema({
  actor: String,
  actorRole: String,
  action: String,
  targetId: mongoose.Schema.Types.ObjectId,
  targetName: String,
  targetUsername: String,
  targetRole: String,
  details: String,
  createdAt: { type: Date, default: Date.now },
});

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

const recordAudit = async ({ actor, actorRole, action, targetId, targetName, targetUsername, targetRole, details }) => {
  try {
    await new AuditLog({ actor, actorRole, action, targetId, targetName, targetUsername, targetRole, details }).save();
  } catch (error) {
    console.error('Audit log error:', error);
  }
};

const updateVehicleMaintenanceStatus = async (vehicle) => {
  const now = new Date();
  const hasOpenIncident = await MaintenanceIssue.exists({ vehicleId: vehicle.vehicleId, incidentStatus: { $in: ['pending', 'in_progress'] } });
  const hasOpenSosAlert = await SOSAlert.exists({ busId: vehicle.vehicleId, status: { $in: ['pending', 'acknowledged'] } });
  // Automate task status flip - all non-completed tasks are now essentially 'pending'
  vehicle.tasks.forEach((task) => {
    if (task.status !== 'completed') {
      task.status = 'pending';
    }
  });


  const anyOverdueTask = vehicle.tasks.some((task) => task.status === 'pending');
  const nextServiceDue = vehicle.nextServiceDate && new Date(vehicle.nextServiceDate) <= now;

  if (hasOpenSosAlert) {
    vehicle.maintenanceStatus = 'emergency';
  } else if (vehicle.active === false) {
    vehicle.maintenanceStatus = 'inactive';
  } else if (hasOpenIncident) {
    vehicle.maintenanceStatus = 'under-maintenance';
  } else if (anyOverdueTask || nextServiceDue) {
    vehicle.maintenanceStatus = 'needs-maintenance';
  } else {
    vehicle.maintenanceStatus = 'active';
  }

  vehicle.updatedAt = new Date();
  await vehicle.save();
  return vehicle;
};

const calculateMaintenanceSummary = (vehicle) => {
  const now = new Date();
  const alerts = [];

  if (vehicle.fuelLevel <= 25) {
    alerts.push({ severity: 'high', message: `Fuel level low at ${vehicle.fuelLevel}%` });
  }
  if (vehicle.coolantTemp >= 95) {
    alerts.push({ severity: 'high', message: `Engine temperature high (${vehicle.coolantTemp}°C)` });
  }
  if (vehicle.insuranceExpiry && vehicle.insuranceExpiry <= new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)) {
    alerts.push({ severity: 'medium', message: 'Insurance expires soon' });
  }
  if (vehicle.licenseExpiry && vehicle.licenseExpiry <= new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000)) {
    alerts.push({ severity: 'medium', message: 'Vehicle license needs renewal soon' });
  }

  const tasks = vehicle.tasks.map((task) => {
    const dueInDays = task.dueDate ? Math.ceil((task.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;
    const dueText = task.status === 'completed'
      ? 'Completed'
      : task.dueInKm != null
      ? `Due in ${task.dueInKm} km`
      : task.dueDate
      ? dueInDays >= 0
        ? `Due in ${dueInDays} days`
        : `Overdue by ${Math.abs(dueInDays)} days`
      : 'Scheduled';

    return {
      _id: task._id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueText,
      dueInKm: task.dueInKm,
      dueDate: task.dueDate,
    };
  });

  const activeAlert = alerts.length
    ? alerts[0].message
    : tasks.some((task) => task.status !== 'completed' && (task.dueInKm != null ? task.dueInKm <= 600 : task.dueDate && task.dueDate <= new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)))
      ? 'Maintenance needs attention soon'
      : 'All systems are functioning normally';

  return {
    activeAlert,
    alerts,
    tasks,
    logs: vehicle.logs,
  };
};

// =====================
// Signup API
// =====================
app.post("/signup", async (req, res) => {
  try {
    console.log('Signup request:', req.body);
    const { name, phone, email, password, role, username, adminType, adminRole } = req.body;

    if (!name || !password) {
      return res.status(400).json({ message: "Name and password are required" });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    // Improved duplicate check
    const duplicateQuery = [];
    if (username) duplicateQuery.push({ username });
    if (phone) duplicateQuery.push({ phone });
    if (email) duplicateQuery.push({ email });

    if (duplicateQuery.length > 0) {
      const existingUser = await User.findOne({ $or: duplicateQuery });
      if (existingUser) {
        let field = "Account";
        if (username && existingUser.username === username) field = "Username";
        else if (phone && existingUser.phone === phone) field = "Phone number";
        else if (email && existingUser.email === email) field = "Email";
        return res.status(400).json({ message: `${field} is already registered` });
      }
    }

    let busId;
    if (role === 'driver') {
      const suffix = phone ? phone.slice(-4) : Math.floor(1000 + Math.random() * 9000);
      busId = `bus-${suffix}`;
      await seedDriverBus(busId, name);
    }

    const newUser = new User({
      name,
      phone: phone || undefined,
      username: username || undefined,
      email: email || undefined,
      password,
      role: role || 'passenger',
      adminType: role === 'admin' ? adminType : undefined,
      adminRole: role === 'admin' ? adminRole || 'admin' : undefined,
      assignedVehicle: busId,
      isActive: true,
    });
    await newUser.save();

    res.status(201).json({ message: "Signup successful", user: newUser });
  } catch (error) {
    console.error('Signup error:', error);
    if (error?.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0] || 'entry';
      return res.status(400).json({ message: `Duplicate ${field} detected. This ${field} is already in use.` });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// =====================
// Driver Custom APIs 
// =====================
app.get('/driver/dashboard', requireAuth, async (req, res) => {
  try {
    const actorRole = req.actorRole;
    if (!USER_ROLES.includes(actorRole)) {
       return res.status(403).json({ message: 'Unauthorized access' });
    }
    
    // Auto-reconcile missing vehicle assignments
    let assignedId = req.user?.assignedVehicle;
    if (!assignedId && req.user && req.user.role === 'driver') {
      const suffix = req.user.phone ? req.user.phone.slice(-4) : req.user._id.toString().slice(-4);
      assignedId = `bus-${suffix}`;
      req.user.assignedVehicle = assignedId;
      await req.user.save();
    }
    
    // Final fallback
    assignedId = assignedId || 'bus-8824';

    let vehicle = await Vehicle.findOne({ vehicleId: assignedId });
    
    // Auto-seed if missing
    if (!vehicle && assignedId.startsWith('bus-')) {
      await seedDriverBus(assignedId, req.user?.name || 'Driver');
      vehicle = await Vehicle.findOne({ vehicleId: assignedId });
    }

    if (!vehicle) {
      return res.status(404).json({ message: 'Assigned vehicle not found in database', noVehicle: true });
    }
    
    let incidentQuery = { vehicleId: assignedId };
    
    // Allow drivers to see all maintenance incidents for their assigned vehicle,
    // not just their own, so they show up in their Maintenance Reminders.
    const incidents = await MaintenanceIssue.find(incidentQuery).sort({ createdAt: -1 });

    // Sync incidents into vehicle.tasks for the frontend to render them seamlessly
    if (vehicle && incidents && incidents.length > 0) {
      // Create a copy of the mongoose document object
      vehicle = vehicle.toObject();
      const existingIncidentIds = (vehicle.tasks || []).map(t => t.incidentId).filter(Boolean);
      
      incidents.forEach(inc => {
        if (!existingIncidentIds.includes(inc._id.toString())) {
          // If it's a MaintenanceIssue, prefix strip its title
          let taskTitle = inc.type || 'Driver Task';
          if (taskTitle.startsWith('Maintenance: ')) {
            taskTitle = taskTitle.replace('Maintenance: ', '');
          }

          vehicle.tasks.push({
            _id: inc._id.toString(), // Use the incident ID as the task ID
            incidentId: inc._id.toString(),
            title: taskTitle,
            type: inc.type || 'general',
            description: inc.description || 'System generated issue.',
            priority: inc.priority || 'medium',
            status: ['resolved', 'closed', 'completed'].includes(inc.incidentStatus) ? 'completed' : 'pending',
            date: inc.createdAt || new Date()
          });
        }
      });
    }

    res.status(200).json({ 
      vehicle, 
      incidents,
      user: {
        name: req.user?.name,
        role: req.user?.role,
        assignedVehicle: assignedId
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

const emitVehicleUpdated = (vehicle) => {
  io.emit('vehicleUpdated', vehicle);
  io.emit('maintenanceUpdate', { vehicleId: vehicle.vehicleId });
};


app.put('/driver/maintenance/:vehicleId/:taskId/complete', requireAuth, async (req, res) => {
  try {
    const actorRole = req.actorRole;
    if (actorRole !== 'driver' && actorRole !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    const { vehicleId, taskId } = req.params;
    const vehicle = await Vehicle.findOne({ vehicleId });
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    const task = vehicle.tasks.id(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Maintenance task not found' });
    }

    task.status = 'completed';
    task.completedAt = new Date();
    task.technician = req.user?.name || 'Driver';
    
    // Update vehicle dates and mileage
    vehicle.lastServiceDate = new Date();
    const currentMileage = vehicle.currentMileage || 0;
    vehicle.nextServiceKm = currentMileage + 10000;
    
    const sixMonthsFromNow = new Date();
    sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
    vehicle.nextServiceDate = sixMonthsFromNow;

    vehicle.logs.push({
      title: 'Maintenance Completed',
      detail: `Driver completed ${task.type || 'maintenance'} task "${task.title}". Status updated to COMPLETED.`,
      date: new Date(),
    });


    await updateVehicleMaintenanceStatus(vehicle);
    emitVehicleUpdated(vehicle);

    // CRITICAL: Sync the corresponding MaintenanceIssue if it exists
    try {
      let linkedIncident = null;
      if (task.incidentId) {
        linkedIncident = await MaintenanceIssue.findById(task.incidentId);
      }
      
      const escapeRegex = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      if (!linkedIncident) {
        linkedIncident = await MaintenanceIssue.findOne({
          vehicleId: vehicle.vehicleId,
          type: task.title,
          incidentStatus: { $nin: ['resolved', 'closed', 'completed'] }
        });
      }

      if (!linkedIncident) {
        linkedIncident = await MaintenanceIssue.findOne({
          vehicleId: vehicle.vehicleId,
          type: { $regex: escapeRegex(task.title), $options: 'i' },
          incidentStatus: { $nin: ['resolved', 'closed', 'completed'] }
        });
      }
      
      if (!linkedIncident && task.description) {
         linkedIncident = await MaintenanceIssue.findOne({
          vehicleId: vehicle.vehicleId,
          description: task.description,
          incidentStatus: { $nin: ['resolved', 'closed', 'completed'] }
        });
      }

      if (linkedIncident) {
        linkedIncident.incidentStatus = 'resolved';
        linkedIncident.history.push({
           status: 'resolved',
           actor: req.user?.name || 'Driver',
           actorRole: 'driver',
           comment: 'Maintenance completed by driver side (sync).',
           date: new Date()
        });
        await linkedIncident.save();
        emitIssueCreated(vehicle.vehicleId, linkedIncident); // Re-emit so admin list updates
      }
    } catch (syncError) {
      console.warn('Admin issue sync failed:', syncError.message);
    }


    res.status(200).json({ message: 'Maintenance successfully completed and synced with admin logs', vehicle });


  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

app.post('/driver/maintenance/:vehicleId/tasks', requireAuth, async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const { title, description, type, priority, dueInKm, dueDate, status } = req.body;
    
    if (!title || !type) {
      return res.status(400).json({ message: 'Title and type are required' });
    }

    const vehicle = await Vehicle.findOne({ vehicleId });
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    const incidentData = {
      vehicleId,
      type: `Maintenance: ${title}`,
      location: 'Depot / On Route',
      description: description || `Driver-initiated maintenance request for ${title}. (${type})`,
      priority: priority || 'medium',
      incidentStatus: 'reported',
      reporter: req.user?.username || req.user?.name || 'driver',
      reporterName: req.user?.name || 'Driver',
      reporterPhone: req.user?.phone || '0771319366',
      history: [{ 
        status: 'reported', 
        actor: req.user?.name || 'Driver', 
        actorRole: 'driver', 
        comment: 'Driver reported this needed maintenance.', 
        date: new Date() 
      }]
    };
    
    const incident = new MaintenanceIssue(incidentData);
    await incident.save();
    emitIssueCreated(vehicleId, incident);

    const newTask = {
      title,
      description,
      type,
      priority: priority || 'medium',
      status: 'pending',
      dueInKm,
      dueDate,
      incidentId: incident._id.toString(),
      reporterName: req.user?.name || 'Driver',
      reporterPhone: req.user?.phone || '0771319366',
      busNumber: vehicle.vehicleId,
      vehicleId: vehicle.vehicleId,
      date: new Date()
    };

    vehicle.tasks.push(newTask);
    
    // Add to logs
    vehicle.logs.push({
      title: 'Manual Maintenance Task Added',
      detail: `Driver added a manual maintenance task: "${title}" linked to incident ${incident._id}`,
      date: new Date()
    });

    await updateVehicleMaintenanceStatus(vehicle);
    emitVehicleUpdated(vehicle);

    res.status(201).json({ message: 'Maintenance task added and synced with admin logs ✅', task: newTask, incident });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// =====================
// Login API
// =====================
app.post("/login", async (req, res) => {
  try {
    const { phone, username, password } = req.body;

    if (!password || (!phone && !username)) {
      return res.status(400).json({ message: "Username or phone and password are required" });
    }

    const query = { password };
    if (username) {
      query.username = username;
    } else {
      query.phone = phone;
    }

    const user = await User.findOne(query);

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (user.isActive === false || user.status === 'inactive') {
      return res.status(403).json({ message: "Account is deactivated" });
    }

    res.status(200).json({
      message: "Login successful",
      user,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// =====================
// Get a single user by phone
// =====================
app.get("/user", async (req, res) => {
  try {
    const { phone } = req.query;
    if (!phone) {
      return res.status(400).json({ message: "Phone is required" });
    }

    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ message: "Server error ❌" });
  }
});

// =====================
// Update user profile or emergency contacts
// =====================
app.put("/user/update", async (req, res) => {
  try {
    const { originalPhone, phone, name, email, bloodGroup, emergencyContacts, profileImage, role, password } = req.body;
    const lookupPhone = originalPhone || phone;

    if (!lookupPhone) {
      return res.status(400).json({ message: "Phone is required" });
    }

    const user = await User.findOne({ phone: lookupPhone });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (name) user.name = name;
    if (email) user.email = email;
    if (bloodGroup) user.bloodGroup = bloodGroup;
    if (phone && phone !== lookupPhone) user.phone = phone;
    if (profileImage) user.profileImage = profileImage;
    if (password) user.password = password;
    if (role) {
      const actorRole = getActorRole(req);
      if (actorRole !== ROLE_SUPER_ADMIN) {
        return res.status(403).json({ message: 'Only Super Admin can change roles' });
      }
      user.role = role;
    }
    if (Array.isArray(emergencyContacts)) {
      user.emergencyContacts = emergencyContacts;
    }
    user.updatedAt = new Date();

    await user.save();
    res.status(200).json({ message: "User updated successfully ✅", user });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(400).json({ message: "Phone number is already registered" });
    }
    res.status(500).json({ message: "Server error ❌" });
  }
});

// =====================
// Get vehicle maintenance status
// =====================
app.get('/maintenance/vehicle', requireAuth, requireRole(ROLE_SUPER_ADMIN, ROLE_ADMIN, ROLE_STAFF), async (req, res) => {
  try {
    const { vehicleId } = req.query;
    if (!vehicleId) {
      return res.status(400).json({ message: 'vehicleId is required' });
    }

    const vehicle = await Vehicle.findOne({ vehicleId });
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    await updateVehicleMaintenanceStatus(vehicle);
    const updatedVehicle = await Vehicle.findOne({ vehicleId });
    const summary = calculateMaintenanceSummary(updatedVehicle);

    res.status(200).json({ vehicle: updatedVehicle, summary });
  } catch (error) {
    res.status(500).json({ message: 'Server error ❌', error });
  }
});

// =====================
// Get all vehicles
// =====================
app.get('/vehicles', requireAuth, requireRole(ROLE_SUPER_ADMIN, ROLE_ADMIN, ROLE_STAFF), async (req, res) => {
  try {
    const { search, status, busNumber } = req.query;
    const query = {};

    if (status) {
      query.maintenanceStatus = status;
    }
    if (busNumber) {
      query.busNumber = busNumber;
    }
    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [
        { busNumber: regex },
        { model: regex },
        { technician: regex },
      ];
    }

    const vehicles = await Vehicle.find(query).sort({ updatedAt: -1 });
    res.status(200).json({ vehicles });
  } catch (error) {
    res.status(500).json({ message: 'Server error ❌', error });
  }
});

// =====================
// Analyze Vehicle Risk
// =====================
app.post('/vehicles/:id/analyze-risk', requireAuth, requireRole(ROLE_SUPER_ADMIN, ROLE_ADMIN, ROLE_MANAGER), async (req, res) => {
  try {
    const { id } = req.params;
    const vehicle = await Vehicle.findOne({ vehicleId: id });
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });

    const incidents = await MaintenanceIssue.find({ vehicleId: id, incidentStatus: { $ne: 'resolved' } });
    
    let score = 0;
    incidents.forEach(inc => {
      score += 15;
      if (inc.priority === 'high') score += 15;
    });
    
    if (vehicle.currentMileage >= vehicle.nextServiceKm) score += 30;
    const lastService = vehicle.lastServiceDate ? new Date(vehicle.lastServiceDate).getTime() : 0;
    const monthsSinceService = lastService ? (Date.now() - lastService) / (1000 * 60 * 60 * 24 * 30) : 12;
    if (monthsSinceService >= 5) score += 20;

    score = Math.min(score, 100);
    vehicle.riskScore = Math.round(score);
    
    let level = 'low';
    if (score >= 40) level = 'medium';
    if (score >= 75) level = 'high';
    vehicle.riskLevel = level;

    const generateAlert = async (msg) => {
      const alert = new SOSAlert({
        busId: vehicle.vehicleId,
        message: msg,
        status: 'pending',
      });
      await alert.save();
      emitAlertCreated(alert);
    };

    if (vehicle.currentMileage >= vehicle.nextServiceKm) {
        await generateAlert(`Preventive Maint: ${vehicle.vehicleId} exceeded service interval.`);
    }
    if (monthsSinceService >= 6) {
        await generateAlert(`Preventive Maint: ${vehicle.vehicleId} exceeded 6-month inspection window.`);
    }

    if (level === 'high') {
      vehicle.suggestedAction = 'Reassign Route';
      if (vehicle.maintenanceStatus === 'ready') vehicle.maintenanceStatus = 'not_ready';
    } else {
      vehicle.suggestedAction = 'None';
    }

    await vehicle.save();
    emitVehicleUpdated(vehicle);
    res.status(200).json({ message: 'Risk analyzed', vehicle });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error });
  }
});

// =====================
// Update vehicle details / maintenance info
// =====================
app.put('/vehicles/:vehicleId', async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const { active, lastServiceDate, nextServiceDate, maintenanceNotes, technician, currentMileage, nextServiceKm, insuranceExpiry, licenseExpiry, performerRole, performerName } = req.body;

    if (!vehicleId) {
      return res.status(400).json({ message: 'vehicleId is required' });
    }

    const vehicle = await Vehicle.findOne({ vehicleId });
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    if (active !== undefined) vehicle.active = Boolean(active);
    if (lastServiceDate) vehicle.lastServiceDate = new Date(lastServiceDate);
    if (nextServiceDate) vehicle.nextServiceDate = new Date(nextServiceDate);
    if (maintenanceNotes !== undefined) vehicle.maintenanceNotes = maintenanceNotes;
    if (technician !== undefined) vehicle.technician = technician;
    if (currentMileage !== undefined) vehicle.currentMileage = Number(currentMileage);
    if (nextServiceKm !== undefined) vehicle.nextServiceKm = Number(nextServiceKm);
    if (insuranceExpiry) vehicle.insuranceExpiry = new Date(insuranceExpiry);
    if (licenseExpiry) vehicle.licenseExpiry = new Date(licenseExpiry);

    vehicle.updatedAt = new Date();
    vehicle.logs.push({ title: 'Vehicle maintenance updated', detail: `Updated by ${performerName || 'System'} (${performerRole || 'unknown'})`, date: new Date() });
    await updateVehicleMaintenanceStatus(vehicle);

    res.status(200).json({ message: 'Vehicle updated successfully ✅', vehicle });
  } catch (error) {
    res.status(500).json({ message: 'Server error ❌', error });
  }
});

// =====================
// Update maintenance task status
// =====================
app.patch('/maintenance/task/:taskId', requireAuth, requireRole(ROLE_SUPER_ADMIN, ROLE_ADMIN), async (req, res) => {
  try {
    const { taskId } = req.params;
    const { vehicleId, status } = req.body;
    if (!vehicleId || !status) {
      return res.status(400).json({ message: 'vehicleId and status are required' });
    }

    const vehicle = await Vehicle.findOne({ vehicleId });
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    const task = vehicle.tasks.id(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    task.status = status;
    task.completedAt = status === 'completed' ? new Date() : task.completedAt;
    vehicle.logs.push({ title: 'Maintenance task updated', detail: `Task ${task.title} marked ${status}`, date: new Date() });
    await updateVehicleMaintenanceStatus(vehicle);

    emitMaintenanceUpdate(vehicleId);
    res.status(200).json({ message: 'Task updated successfully ✅', task });
  } catch (error) {
    res.status(500).json({ message: 'Server error ❌', error });
  }
});

// =====================
// Create maintenance task
// =====================
app.post('/maintenance/task', requireAuth, requireRole(ROLE_SUPER_ADMIN, ROLE_ADMIN, ROLE_STAFF, 'driver'), async (req, res) => {
  try {
    const { vehicleId, title, description, type, dueInKm, dueDate, priority, status, cost, technician, date } = req.body;
    const performerName = req.user?.name || req.body.performerName || 'Staff';
    const performerRole = req.user?.role || req.body.performerRole || 'staff';
    
    if (!vehicleId || !title || !description) {
      return res.status(400).json({ message: 'vehicleId, title and description are required' });
    }

    const vehicle = await Vehicle.findOne({ vehicleId });
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    const newTask = {
      title,
      description,
      type: type || 'general',
      dueInKm: dueInKm != null ? Number(dueInKm) : undefined,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      priority: priority || 'medium',
      status: status || 'pending',
      cost: cost != null ? Number(cost) : undefined,
      technician: technician || performerName,
      date: date ? new Date(date) : new Date(),
    };

    vehicle.tasks.push(newTask);
    vehicle.logs.push({ 
      title: 'New maintenance task added', 
      detail: `Created by ${performerName} (${performerRole})`, 
      date: new Date() 
    });
    await updateVehicleMaintenanceStatus(vehicle);

    const addedTask = vehicle.tasks[vehicle.tasks.length - 1];
    emitMaintenanceUpdate(vehicleId);
    res.status(201).json({ message: 'Task created successfully ✅', task: addedTask });
  } catch (error) {
    res.status(500).json({ message: 'Server error ❌', error });
  }
});

// =====================
// Maintenance history
// =====================
app.get('/maintenance/history', requireAuth, requireRole(ROLE_SUPER_ADMIN, ROLE_ADMIN, ROLE_STAFF), async (req, res) => {
  try {
    const { vehicleId } = req.query;
    if (!vehicleId) {
      return res.status(400).json({ message: 'vehicleId is required' });
    }

    const vehicle = await Vehicle.findOne({ vehicleId });
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    res.status(200).json({
      vehicleId: vehicle.vehicleId,
      busNumber: vehicle.busNumber,
      maintenanceStatus: vehicle.maintenanceStatus,
      lastServiceDate: vehicle.lastServiceDate,
      nextServiceDate: vehicle.nextServiceDate,
      technician: vehicle.technician,
      maintenanceNotes: vehicle.maintenanceNotes,
      logs: vehicle.logs,
      tasks: vehicle.tasks,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error ❌', error });
  }
});

app.get('/maintenance/tasks', requireAuth, requireRole(ROLE_SUPER_ADMIN, ROLE_ADMIN, ROLE_STAFF), async (req, res) => {
  try {
    const vehicles = await Vehicle.find({});
    let allTasks = [];
    vehicles.forEach(v => {
      v.tasks.forEach(t => {
        allTasks.push({
          ...t.toObject(),
          vehicleId: v.vehicleId,
          busNumber: v.busNumber
        });
      });
    });
    
    // Sort by date (descending)
    allTasks.sort((a,b) => new Date(b.date || b.completedAt || b.createdAt) - new Date(a.date || a.completedAt || a.createdAt));
    
    res.status(200).json({ tasks: allTasks });
  } catch (error) {
    res.status(500).json({ message: 'Server error ❌', error });
  }
});

// =====================
// Maintenance issues
// =====================
app.get('/maintenance/issues', requireAuth, requireRole(ROLE_SUPER_ADMIN, ROLE_ADMIN, ROLE_STAFF), async (req, res) => {
  try {
    const { vehicleId } = req.query;
    const query = vehicleId ? { vehicleId } : {};
    const issues = await MaintenanceIssue.find(query).sort({ createdAt: -1 });
    res.status(200).json({ issues });
  } catch (error) {
    res.status(500).json({ message: 'Server error ❌', error });
  }
});

app.post('/maintenance/issues', requireAuth, requireRole(ROLE_SUPER_ADMIN, ROLE_ADMIN), async (req, res) => {
  try {
    const { vehicleId, type, location, description, priority, assignedTo, reporter } = req.body;
    if (!vehicleId || !type || !description) {
      return res.status(400).json({ message: 'vehicleId, type and description are required' });
    }

    const issue = new MaintenanceIssue({
      vehicleId,
      type,
      location,
      description,
      priority: priority || 'medium',
      assignedTo: assignedTo || null,
      reporter: reporter || 'unknown',
      incidentStatus: 'pending',
      history: [{ status: 'pending', actor: reporter || 'System', actorRole: 'reporter', comment: 'Incident reported', date: new Date() }],
    });
    await issue.save();

    const vehicle = await Vehicle.findOne({ vehicleId });
    if (vehicle) {
      vehicle.active = false;
      vehicle.logs.push({ title: 'Incident reported', detail: `${issue.type} reported by ${issue.reporter}`, date: new Date() });
      await updateVehicleMaintenanceStatus(vehicle);
    }

    emitIssueCreated(vehicleId, issue);
    res.status(201).json({ message: 'Issue reported successfully ✅', issue });
  } catch (error) {
    res.status(500).json({ message: 'Server error ❌', error });
  }
});

// =====================
// Incident Management Admin
// =====================
app.put('/maintenance/issues/:id/acknowledge', requireAuth, requireRole(ROLE_SUPER_ADMIN, ROLE_ADMIN), async (req, res) => {
  try {
    const { id } = req.params;
    const performer = req.user?.name || 'Admin';
    
    const issue = await MaintenanceIssue.findById(id);
    if (!issue) return res.status(404).json({ message: 'Issue not found' });

    issue.incidentStatus = 'acknowledged'; // 'Under Review' mapping
    issue.history.push({
      status: 'acknowledged',
      actor: performer,
      actorRole: req.user?.role || 'admin',
      comment: 'Administrator moved this issue to UNDER REVIEW.',
      date: new Date()
    });
    await issue.save();

    emitIssueCreated(issue.vehicleId, issue);
    res.status(200).json({ message: 'Incident acknowledged ✅', issue });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.put('/maintenance/issues/:id/resolve', requireAuth, requireRole(ROLE_SUPER_ADMIN, ROLE_ADMIN), async (req, res) => {
  try {
    const { id } = req.params;
    const performer = req.user?.name || 'Admin';

    const issue = await MaintenanceIssue.findById(id);
    if (!issue) return res.status(404).json({ message: 'Issue not found' });

    issue.incidentStatus = 'resolved';
    issue.history.push({
      status: 'resolved',
      actor: performer,
      actorRole: req.user?.role || 'admin',
      comment: 'Administrator marked this as RESOLVED/COMPLETED.',
      date: new Date()
    });
    await issue.save();

    // Trigger vehicle readiness update
    const vehicle = await Vehicle.findOne({ vehicleId: issue.vehicleId });
    if (vehicle) {
       await updateVehicleMaintenanceStatus(vehicle);
       emitVehicleUpdated(vehicle);
    }

    emitIssueCreated(issue.vehicleId, issue);
    res.status(200).json({ message: 'Incident resolved successfully ✅', issue });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.post('/maintenance/risk/analyze', requireAuth, requireRole(ROLE_SUPER_ADMIN, ROLE_ADMIN), async (req, res) => {
  try {
    const vehicles = await Vehicle.find({});
    const now = new Date();
    const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));

    for (const vehicle of vehicles) {
       const recentIssues = await MaintenanceIssue.countDocuments({
         vehicleId: vehicle.vehicleId,
         createdAt: { $gte: thirtyDaysAgo },
         type: { $ne: 'SOS Emergency' }
       });

       // Logic for risk classification
       if (recentIssues >= 3) {
         vehicle.riskLevel = 'high';
         vehicle.suggestedAction = 'Immediate overhaul recommended. Critical breakdown frequency.';
       } else if (recentIssues >= 1) {
         vehicle.riskLevel = 'medium';
         vehicle.suggestedAction = 'Schedule preventive maintenance soon. Moderate breakdown frequency.';
       } else {
         vehicle.riskLevel = 'low';
         vehicle.suggestedAction = 'Vehicle performing within normal parameters.';
       }
       
       await vehicle.save();
    }

    res.status(200).json({ message: 'Fleet risk analysis refreshed successfully ✅' });
  } catch (error) {
    res.status(500).json({ message: 'Risk analysis failed', error: error.message });
  }
});


// =====================
// SOS endpoints
// =====================
app.get('/sos', async (req, res) => {
  try {
    const { status, busId, driverId } = req.query;
    const query = {};
    if (status) query.status = status;
    if (busId) query.busId = busId;
    if (driverId) query.driverId = driverId;

    const sosRequests = await SOSRequest.find(query).sort({ createdAt: -1 });
    res.status(200).json({ sosRequests });
  } catch (error) {
    res.status(500).json({ message: 'Server error ❌', error });
  }
});

app.get('/alerts', requireAuth, requireRole(ROLE_SUPER_ADMIN, ROLE_ADMIN, ROLE_STAFF), async (req, res) => {
  try {
    const { status, busId, driverId } = req.query;
    const query = {};
    if (status) {
      const statuses = String(status).split(',').map((item) => item.trim()).filter(Boolean);
      query.status = statuses.length === 1 ? statuses[0] : { $in: statuses };
    }
    if (busId) query.busId = busId;
    if (driverId) query.driverId = driverId;

    const alerts = await SOSAlert.find(query).sort({ createdAt: -1 });
    res.status(200).json({ alerts });
  } catch (error) {
    res.status(500).json({ message: 'Server error ❌', error });
  }
});

app.get('/emergency-contacts', async (req, res) => {
  try {
    const driverPhone = req.get('x-user-phone');
    const query = driverPhone ? { createdBy: driverPhone } : {};
    const contacts = await EmergencyContact.find(query).sort({ createdAt: -1 });
    res.status(200).json({ contacts });
  } catch (error) {
    res.status(500).json({ message: 'Server error ❌', error });
  }
});

app.post('/emergency-contacts', requireAuth, async (req, res) => {
  try {
    const { name, phone, email, bloodGroup } = req.body;
    const driverPhone = req.get('x-user-phone');
    if (!name || !phone) {
      return res.status(400).json({ message: 'Name and phone are required' });
    }
    if (!/^\+?[0-9\s\-]{7,20}$/.test(phone)) {
      return res.status(400).json({ message: 'Please enter a valid phone number' });
    }
    // Enforce 2-contact limit per driver
    if (driverPhone) {
      const existing = await EmergencyContact.countDocuments({ createdBy: driverPhone });
      if (existing >= 2) {
        return res.status(400).json({ message: 'You can only add up to 2 emergency contacts.' });
      }
    }
    const contact = new EmergencyContact({ name, phone, email: email || '', bloodGroup: bloodGroup || '', createdBy: driverPhone || '' });
    await contact.save();
    res.status(201).json({ message: 'Emergency contact created ✅', contact });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(500).json({ message: 'Server error ❌', error });
  }
});

app.put('/emergency-contacts/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, email, bloodGroup } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ message: 'Name and phone are required' });
    }
    if (!/^\+?[0-9\s\-]{7,20}$/.test(phone)) {
      return res.status(400).json({ message: 'Please enter a valid phone number' });
    }
    const contact = await EmergencyContact.findById(id);
    if (!contact) {
      return res.status(404).json({ message: 'Emergency contact not found' });
    }
    contact.name = name;
    contact.phone = phone;
    contact.email = email || '';
    contact.bloodGroup = bloodGroup || contact.bloodGroup || '';
    contact.updatedAt = new Date();
    await contact.save();
    res.status(200).json({ message: 'Emergency contact updated ✅', contact });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(500).json({ message: 'Server error ❌', error });
  }
});

app.delete('/emergency-contacts/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const contact = await EmergencyContact.findById(id);
    await EmergencyContact.findByIdAndDelete(id);
    res.status(200).json({ message: 'Emergency contact deleted ✅' });
  } catch (error) {
    res.status(500).json({ message: 'Server error ❌', error });
  }
});

app.delete('/emergency-contacts-clear', requireAuth, async (req, res) => {
  try {
    const driverPhone = req.get('x-user-phone');
    if (!driverPhone) {
      return res.status(400).json({ message: 'Driver phone is required to clear contacts' });
    }
    await EmergencyContact.deleteMany({ createdBy: driverPhone });
    res.status(200).json({ message: 'All emergency contacts cleared ✅' });
  } catch (error) {
    res.status(500).json({ message: 'Server error ❌', error });
  }
});

app.post('/sos', async (req, res) => {
  try {
    const { busId, driverId, location, details } = req.body;
    if (!busId || !driverId) {
      return res.status(400).json({ message: 'busId and driverId are required' });
    }

    const sos = new SOSRequest({
      busId,
      driverId,
      location: location || 'Unknown location',
      details: details || 'Driver requested emergency assistance.',
      status: 'pending',
    });
    await sos.save();
    
    // Trigger the alert immediately instead of waiting 5 minutes
    await triggerSOSAlert(sos);

    emitSOSCreated(sos);
    res.status(201).json({ message: 'SOS request submitted and alert triggered immediateley ✅', sos });
  } catch (error) {
    res.status(500).json({ message: 'Server error ❌', error });
  }
});

app.put('/sos/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;
    const sos = await SOSRequest.findById(id);
    if (!sos) {
      return res.status(404).json({ message: 'SOS request not found' });
    }
    if (sos.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending SOS requests can be cancelled' });
    }

    sos.status = 'cancelled';
    sos.updatedAt = new Date();
    await sos.save();
    clearSosTimer(sos._id);

    emitSOSUpdated(sos);
    res.status(200).json({ message: 'SOS request cancelled ✅', sos });
  } catch (error) {
    res.status(500).json({ message: 'Server error ❌', error });
  }
});

app.put('/alerts/:id/acknowledge', async (req, res) => {
  try {
    const { id } = req.params;
    const alert = await SOSAlert.findById(id);
    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    const now = new Date();
    if (!alert.firstActionAt) {
      alert.firstActionAt = now;
      alert.responseTimeSeconds = Math.round((now.getTime() - alert.createdAt.getTime()) / 1000);
    }
    alert.status = 'acknowledged';
    alert.isRead = true;
    alert.updatedAt = now;
    await alert.save();

    emitAlertUpdated(alert);
    res.status(200).json({ message: 'Alert acknowledged ✅', alert });
  } catch (error) {
    res.status(500).json({ message: 'Server error ❌', error });
  }
});

app.put('/alerts/:id/forward', requireAuth, requireRole(ROLE_SUPER_ADMIN, ROLE_ADMIN), async (req, res) => {
  try {
    const { id } = req.params;
    const { department, message, sender, senderRole } = req.body;
    const allowed = ['maintenance', 'emergency', 'management'];
    if (!department || !allowed.includes(department)) {
      return res.status(400).json({ message: 'Invalid forwarding department' });
    }

    const alert = await SOSAlert.findById(id);
    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    const now = new Date();
    if (!alert.firstActionAt) {
      alert.firstActionAt = now;
      alert.responseTimeSeconds = Math.round((now.getTime() - alert.createdAt.getTime()) / 1000);
    }
    alert.forwards.push({ department, message: message || `Forwarded to ${department}`, sender: sender || 'Admin', senderRole: senderRole || 'admin' });
    alert.status = alert.status === 'pending' ? 'acknowledged' : alert.status;
    alert.isRead = true;
    alert.updatedAt = now;
    await alert.save();

    emitAlertUpdated(alert);
    io.emit('sosAlertForwarded', { alertId: alert._id, department, message: message || '', sender: sender || 'Admin', senderRole: senderRole || 'admin' });
    res.status(200).json({ message: 'Alert forwarded successfully ✅', alert });
  } catch (error) {
    res.status(500).json({ message: 'Server error ❌', error });
  }
});

app.put('/alerts/:id/read', requireAuth, requireRole(ROLE_SUPER_ADMIN, ROLE_ADMIN, ROLE_STAFF), async (req, res) => {
  try {
    const { id } = req.params;
    const alert = await SOSAlert.findById(id);
    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }
    alert.isRead = true;
    alert.updatedAt = new Date();
    await alert.save();
    emitAlertUpdated(alert);
    res.status(200).json({ message: 'Alert marked read ✅', alert });
  } catch (error) {
    res.status(500).json({ message: 'Server error ❌', error });
  }
});

app.get('/notifications', requireAuth, requireRole(ROLE_SUPER_ADMIN, ROLE_ADMIN, ROLE_STAFF), async (req, res) => {
  try {
    const { unread } = req.query;
    const query = {};
    if (unread === 'true') {
      query.isRead = false;
    }
    const alerts = await SOSAlert.find(query).sort({ createdAt: -1 }).limit(50);
    res.status(200).json({ notifications: alerts.map((alert) => ({
      _id: alert._id,
      message: alert.message,
      busId: alert.busId,
      status: alert.status,
      isRead: alert.isRead,
      createdAt: alert.createdAt,
      responseTimeSeconds: alert.responseTimeSeconds,
    })) });
  } catch (error) {
    res.status(500).json({ message: 'Server error ❌', error });
  }
});

app.put('/alerts/:id/resolve', async (req, res) => {
  try {
    const { id } = req.params;
    const alert = await SOSAlert.findById(id);
    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    alert.status = 'resolved';
    alert.updatedAt = new Date();
    await alert.save();

    const sos = await SOSRequest.findById(alert.sosId);
    if (sos) {
      sos.status = 'resolved';
      sos.resolvedAt = new Date();
      sos.updatedAt = new Date();
      await sos.save();

      if (sos.incidentId) {
        const incident = await MaintenanceIssue.findById(sos.incidentId);
        if (incident && incident.incidentStatus !== 'resolved') {
          incident.incidentStatus = 'resolved';
          incident.history.push({
            status: 'resolved',
            actor: 'System',
            actorRole: 'system',
            comment: 'SOS alert resolved by admin',
            date: new Date(),
          });
          incident.updatedAt = new Date();
          await incident.save();
        }
      }

      const vehicle = await Vehicle.findOne({ vehicleId: sos.busId });
      if (vehicle) {
        const openCount = await MaintenanceIssue.countDocuments({ vehicleId: vehicle.vehicleId, incidentStatus: { $in: ['pending', 'in_progress'] } });
        if (openCount === 0) {
          vehicle.active = true;
        }
        vehicle.logs.push({ title: 'SOS alert resolved', detail: `SOS for ${sos.busId} marked resolved`, date: new Date() });
        await updateVehicleMaintenanceStatus(vehicle);
      }

      emitSOSUpdated(sos);
    }

    emitAlertUpdated(alert);
    res.status(200).json({ message: 'Alert resolved ✅', alert });
  } catch (error) {
    res.status(500).json({ message: 'Server error ❌', error });
  }
});

// =====================
// Incident endpoints
// =====================
app.get('/incidents', requireAuth, requireRole(ROLE_SUPER_ADMIN, ROLE_ADMIN, ROLE_STAFF, ROLE_MANAGER), async (req, res) => {
  try {
    const { search, status, priority, vehicleId } = req.query;
    const query = {};

    if (vehicleId) query.vehicleId = vehicleId;
    if (status) {
      if (status.includes(',')) {
        query.incidentStatus = { $in: status.split(',') };
      } else {
        query.incidentStatus = status;
      }
    }
    if (priority) query.priority = priority;
    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [
        { type: regex },
        { location: regex },
        { description: regex },
      ];
    }

    const incidents = await MaintenanceIssue.find(query).populate('assignedTo', 'name email role phone').sort({ updatedAt: -1, createdAt: -1 });
    res.status(200).json({ incidents });
  } catch (error) {
    res.status(500).json({ message: 'Server error ❌', error });
  }
});

app.post('/incidents', requireAuth, requireRole(ROLE_SUPER_ADMIN, ROLE_ADMIN, ROLE_STAFF, ROLE_MANAGER, 'driver'), async (req, res) => {
  try {
    const { vehicleId, type, location, description, priority, assignedTo, reporter } = req.body;
    const actorRole = getActorRole(req);
    const incident = new MaintenanceIssue({
      vehicleId,
      type,
      location,
      description,
      priority: priority || 'medium',
      assignedTo: assignedTo || null,
      reporter: reporter || req.user?.username || req.user?.name || 'staff',
      reporterName: req.user?.name || reporter || 'Staff',
      reporterPhone: req.user?.phone || '0771319366',
      incidentStatus: 'reported',
      history: [{ status: 'reported', actor: reporter || req.user?.name || 'staff', actorRole, comment: 'Incident reported', date: new Date() }]
    });
    await incident.save();
    
    emitIssueCreated(vehicleId, incident);
    res.status(201).json({ message: 'Incident reported successfully ✅', incident });
  } catch (error) {
    res.status(500).json({ message: 'Server error ❌', error });
  }
});

app.get('/incidents/:id', requireAuth, requireRole(ROLE_SUPER_ADMIN, ROLE_ADMIN, ROLE_STAFF, ROLE_MANAGER), async (req, res) => {
  try {
    const { id } = req.params;
    const incident = await MaintenanceIssue.findById(id).populate('assignedTo', 'name email role phone');
    if (!incident) {
      return res.status(404).json({ message: 'Incident not found' });
    }
    res.status(200).json({ incident });
  } catch (error) {
    res.status(500).json({ message: 'Server error ❌', error });
  }
});

app.put('/incidents/:id', requireAuth, requireRole(ROLE_SUPER_ADMIN, ROLE_ADMIN, ROLE_MANAGER, ROLE_STAFF, 'driver'), async (req, res) => {
  try {
    const { id } = req.params;
    const { incidentStatus, assignedTo, priority, comment, actor, actorRole } = req.body;
    console.log(`[PUT /incidents/${id}] Status: ${incidentStatus}, Actor: ${actor} (${actorRole})`);
    
    const incident = await MaintenanceIssue.findById(id);
    if (!incident) {
      return res.status(404).json({ message: 'Incident not found' });
    }

    let statusUpdated = false;
    if (incidentStatus && incident.incidentStatus !== incidentStatus) {
      incident.incidentStatus = incidentStatus;
      statusUpdated = true;
    }
    if (assignedTo !== undefined) incident.assignedTo = assignedTo || null;
    if (priority) incident.priority = priority;
    
    incident.updatedAt = new Date();
    incident.history.push({ status: incident.incidentStatus, actor: actor || 'System', actorRole: actorRole || 'unknown', comment: comment || (statusUpdated ? `Status changed to ${incident.incidentStatus}` : 'Incident updated'), date: new Date() });
    await incident.save();

    const vehicle = await Vehicle.findOne({ vehicleId: incident.vehicleId });
    if (vehicle && statusUpdated) {
      if (incident.incidentStatus !== 'resolved' && incident.incidentStatus !== 'closed') {
        vehicle.active = false;
      } else {
        const openCount = await MaintenanceIssue.countDocuments({ 
          vehicleId: vehicle.vehicleId, 
          incidentStatus: { $in: ['reported', 'assigned', 'in_progress', 'pending', 'under_review'] } 
        });
        if (openCount === 0) {
          vehicle.active = true;
        }
      }
      vehicle.logs.push({ title: 'Incident updated', detail: `Incident ${incident._id.toString().slice(-4)} status changed to ${incident.incidentStatus}`, date: new Date() });
      await updateVehicleMaintenanceStatus(vehicle);
    }

    const populatedIncident = await MaintenanceIssue.findById(id).populate('assignedTo', 'name email role phone');
    emitIssueUpdated(incident.vehicleId, populatedIncident);
    res.status(200).json({ message: 'Incident updated successfully ✅', incident: populatedIncident });
  } catch (error) {
    res.status(500).json({ message: 'Server error ❌', error });
  }
});

app.post('/incidents/:id/comments', requireAuth, requireRole(ROLE_SUPER_ADMIN, ROLE_ADMIN, ROLE_MANAGER, ROLE_STAFF), async (req, res) => {
  try {
    const { id } = req.params;
    const { comment, actor, actorRole } = req.body;
    const incident = await MaintenanceIssue.findById(id);
    if (!incident) {
      return res.status(404).json({ message: 'Incident not found' });
    }
    
    incident.comments.push({ actor: actor || 'Staff', actorRole: actorRole || 'staff', comment, date: new Date() });
    incident.updatedAt = new Date();
    await incident.save();
    
    const populatedIncident = await MaintenanceIssue.findById(id).populate('assignedTo', 'name email role phone');
    res.status(200).json({ message: 'Comment added', incident: populatedIncident });
  } catch (error) {
    res.status(500).json({ message: 'Server error ❌', error });
  }
});

app.delete('/incidents/:id', requireAuth, requireRole(ROLE_SUPER_ADMIN, ROLE_ADMIN, ROLE_MANAGER, 'driver'), async (req, res) => {
  try {
    const { id } = req.params;
    const actor = req.get('x-user-name');
    const actorRole = req.actorRole;

    const incident = await MaintenanceIssue.findById(id);
    if (!incident) {
      return res.status(404).json({ message: 'Incident not found' });
    }

    const vehicleId = incident.vehicleId;
    const incidentType = incident.type;
    const incidentAssigned = incident.assignedTo;
    const incidentStatus = incident.incidentStatus;

    await MaintenanceIssue.findByIdAndDelete(id);
    
    await recordAudit({
      actor: actor || 'System',
      actorRole: actorRole || 'unknown',
      action: 'deleted-incident',
      targetId: id,
      targetName: incidentType,
      targetUsername: incidentAssigned ? String(incidentAssigned) : null,
      targetRole: incidentStatus,
      details: `Deleted incident for vehicle ${vehicleId}`,
    });

    const vehicle = await Vehicle.findOne({ vehicleId });
    if (vehicle) {
      const openCount = await MaintenanceIssue.countDocuments({ 
        vehicleId: vehicle.vehicleId, 
        incidentStatus: { $in: ['pending', 'reported', 'in_progress', 'assigned'] } 
      });
      if (openCount === 0) {
        vehicle.active = true;
      }
      await updateVehicleMaintenanceStatus(vehicle);
    }

    res.status(200).json({ message: 'Incident deleted successfully ✅' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ message: 'Server error ❌', error: error.message });
  }
});

// =====================
// Admin list
// =====================
  app.post("/users", requireAuth, requireRole(ROLE_SUPER_ADMIN, ROLE_ADMIN), async (req, res) => {
    try {
      const { name, username, password, email, phone, role, adminType, adminRole } = req.body;
      if (!name || !password || !role) {
        return res.status(400).json({ message: "Name, password, and role are required" });
      }
      if (!USER_ROLES.includes(role)) {
        return res.status(400).json({ message: "Invalid role." });
      }
      if (['admin', 'super-admin', 'staff'].includes(role) && !username) {
        return res.status(400).json({ message: "Admin/staff accounts require a username" });
      }
      if (['passenger', 'driver'].includes(role) && !phone && !username) {
        return res.status(400).json({ message: "Passenger/driver accounts require a phone number or username" });
      }
      if (role === ROLE_ADMIN && (!adminType || !adminRole)) {
        return res.status(400).json({ message: "Admin creation requires access type and admin role" });
      }
      const duplicateQuery = [];
      if (username) duplicateQuery.push({ username });
      if (phone) duplicateQuery.push({ phone });
      
      const existingUser = await User.findOne({ $or: duplicateQuery });
      if (existingUser) {
        const field = (username && existingUser.username === username) ? 'Username' : 'Phone number';
        return res.status(400).json({ message: `${field} is already registered` });
      }
      let busId;
      if (role === 'driver') {
        const suffix = phone ? phone.slice(-4) : Math.floor(1000 + Math.random() * 9000);
        busId = `bus-${suffix}`;
        await seedDriverBus(busId, name);
      }

      const newUser = new User({
        name,
        username: username || undefined,
        password,
        email: email || undefined,
        phone: phone || undefined,
        role,
        status: 'active',
        isActive: true,
        adminType: role === ROLE_ADMIN ? adminType : undefined,
        adminRole: role === ROLE_ADMIN ? adminRole || ROLE_ADMIN : (role === ROLE_SUPER_ADMIN ? ROLE_SUPER_ADMIN : undefined),
        assignedVehicle: busId,
      });
      await newUser.save();
      await recordAudit({
        actor: req.get('x-user-name') || 'system',
        actorRole: req.actorRole,
        action: `created-${role}`,
        targetId: newUser._id,
        targetName: newUser.name,
        targetUsername: newUser.username,
        targetRole: newUser.role,
        details: `Created user ${newUser.username || newUser.phone} with role ${newUser.role}`,
      });
      res.status(201).json({ message: "User created ✅", user: { ...newUser.toObject(), password: undefined } });
    } catch (error) {
      console.error('Create user error:', error);
      if (error?.code === 11000) {
        const field = Object.keys(error.keyPattern || {})[0] || 'entry';
        return res.status(400).json({ message: `Duplicate ${field} detected. This ${field} is already in use.` });
      }
      res.status(500).json({ message: "Could not create user" });
    }
  });

  app.get("/users", requireAuth, requireRole(ROLE_SUPER_ADMIN, ROLE_ADMIN, ROLE_STAFF), async (req, res) => {
    try {
      const { search, role, status } = req.query;
      const query = {};
      if (search) {
        query.$or = [
          { name: new RegExp(search, 'i') },
          { username: new RegExp(search, 'i') },
          { email: new RegExp(search, 'i') },
        ];
      }
      if (role) query.role = role;
      if (status) query.status = status;
      const users = await User.find(query).select('-password').sort({ updatedAt: -1 });
      res.status(200).json({ users });
    } catch (error) {
      console.error('Fetch users error:', error);
      res.status(500).json({ message: "Could not fetch users" });
    }
  });

  app.get("/users/stats", requireAuth, requireRole(ROLE_SUPER_ADMIN, ROLE_ADMIN, ROLE_STAFF), async (req, res) => {
    try {
      const passengers = await User.countDocuments({ role: 'passenger' });
      const drivers = await User.countDocuments({ role: 'driver' });
      const overall = await User.countDocuments();
      const totalIncidents = await MaintenanceIssue.countDocuments();
      res.status(200).json({ passengers, drivers, overall, totalIncidents });
    } catch (error) {
      console.error('Fetch stats error:', error);
      res.status(500).json({ message: "Could not fetch stats" });
    }
  });

  // Modified for self-service: Allow super-admin, admin, or THE USER themselves to update
  app.put("/users/:id", requireAuth, async (req, res) => {
    const { id } = req.params;
    const isSelf = req.get('x-user-id') === id; // We can pass x-user-id from frontend
    
    // If not self, must be admin or super-admin
    if (!isSelf && !['admin', 'super-admin'].includes(req.actorRole)) {
      return res.status(403).json({ message: "You are not authorized to update this user." });
    }

    console.log('PUT /users/:id triggered', id, req.body);
    try {
      const { id } = req.params;
      const { name, username, password, email, phone, role, adminType, adminRole, isActive, status } = req.body;
      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Security check: Standard admins cannot update super admins
      if (req.actorRole === ROLE_ADMIN && user.role === ROLE_SUPER_ADMIN) {
        return res.status(403).json({ message: "Standard Administrators cannot modify Super Admin accounts" });
      }

      if (username && username !== user.username) {
        const duplicate = await User.findOne({ username });
        if (duplicate) {
          return res.status(400).json({ message: "Username already taken" });
        }
      }
      user.name = name || user.name;
      user.username = username || user.username;
      if (password) user.password = password;
      user.email = email || user.email;
      user.phone = phone || user.phone;
      if (role) {
        if (!USER_ROLES.includes(role)) {
          return res.status(400).json({ message: "Invalid role update" });
        }
        user.role = role;
      }
      if (user.role === ROLE_ADMIN) {
        user.adminType = adminType || user.adminType || 'user-management';
        user.adminRole = adminRole || user.adminRole || ROLE_ADMIN;
      } else if (user.role === ROLE_SUPER_ADMIN) {
        user.adminType = undefined;
        user.adminRole = ROLE_SUPER_ADMIN;
      } else {
        user.adminType = undefined;
        user.adminRole = undefined;
      }
      if (typeof isActive === 'boolean') {
        user.isActive = isActive;
      }
      if (status) {
        user.status = status;
        user.isActive = status === 'active';
      }
      await user.save();
      await recordAudit({
        actor: req.get('x-user-name') || 'system',
        actorRole: req.actorRole,
        action: `updated-${user.role}`,
        targetId: user._id,
        targetName: user.name,
        targetUsername: user.username,
        targetRole: user.role,
        details: `Updated user ${user.username} (${user.role}) status=${user.status}`,
      });
      res.status(200).json({ message: "User updated ✅", user: { ...user.toObject(), password: undefined } });
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({ message: "Could not update user" });
    }
  });

  // Modified for self-service: Allow super-admin OR THE USER themselves to delete
  app.delete("/users/:id", requireAuth, async (req, res) => {
    const { id } = req.params;
    const xUserId = req.get('x-user-id');
    const isSelf = xUserId === id;

    console.log('DELETE /users/:id triggered', { id, xUserId, isSelf, actorRole: req.actorRole });

    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log('Invalid ObjectId format');
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    if (!isSelf && req.actorRole !== ROLE_SUPER_ADMIN) {
      console.log('Permission denied: not self and not super-admin');
      return res.status(403).json({ message: "Only the account owner or Super Admin can delete this account." });
    }

    try {
      const user = await User.findById(id);
      if (!user) {
        console.log('User not found by id');
        return res.status(404).json({ message: "User not found" });
      }
      await User.deleteOne({ _id: id });
      console.log('User deleted successfully');
      await recordAudit({
        actor: req.get('x-user-name') || 'system',
        actorRole: req.actorRole,
        action: `deleted-${user.role}`,
        targetId: user._id,
        targetName: user.name,
        targetUsername: user.username,
        targetRole: user.role,
        details: `Deleted user ${user.username} (${user.role})`,
      });
      res.status(200).json({ message: "User deleted ✅" });
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({ message: "Could not delete user" });
    }
  });

// =====================
// Audit Log endpoints
// =====================
app.get('/audit', requireAuth, requireRole(ROLE_SUPER_ADMIN, ROLE_ADMIN, ROLE_MANAGER), async (req, res) => {
  try {
    const logs = await AuditLog.find({}).sort({ createdAt: -1 }).limit(100);
    res.status(200).json({ logs });
  } catch (error) {
    res.status(500).json({ message: 'Server error ❌', error });
  }
});
app.get("/admins", requireAuth, requireRole(ROLE_SUPER_ADMIN, ROLE_ADMIN), async (req, res) => {
  try {
    const { search, adminRole, active } = req.query;
    const query = { role: 'admin' };

    if (adminRole) {
      query.adminRole = adminRole;
    }
    if (active === 'true' || active === 'false') {
      query.isActive = active === 'true';
    }
    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [
        { name: regex },
        { username: regex },
        { email: regex },
      ];
    }

    const admins = await User.find(query).select('-password').sort({ updatedAt: -1 });
    res.status(200).json({ admins });
  } catch (error) {
    console.error('Fetch admins error:', error);
    res.status(500).json({ message: "Server error ❌" });
  }
});

// =====================
// Create admin user
// =====================
app.post("/admins", requireAuth, requireRole(ROLE_SUPER_ADMIN), async (req, res) => {
  try {
    const { name, username, password, email, phone, role, adminType, adminRole, performerRole, performerName } = req.body;

    if (!name || !username || !password || !role) {
      return res.status(400).json({ message: "Name, username, password, and role are required" });
    }
    if (!ADMIN_ROLES.includes(role)) {
      return res.status(400).json({ message: "Invalid role. Allowed roles are admin or staff." });
    }
    if (role === ROLE_ADMIN && (!adminType || !adminRole)) {
      return res.status(400).json({ message: "Admin creation requires access type and admin role" });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    const performerRoleResolved = getActorRole(req);
    if (performerRoleResolved !== ROLE_SUPER_ADMIN) {
      return res.status(403).json({ message: "Only Super Admin can create admin or staff accounts" });
    }

    const existingUser = await User.findOne({ $or: [{ username }, { phone }] });
    if (existingAdmin) {
      return res.status(400).json({ message: "Username or phone is already registered" });
    }

    const newAdmin = new User({
      name,
      username,
      email,
      phone: phone || null,
      password,
      role: 'admin',
      adminType,
      adminRole,
      isActive: true,
    });

    await newAdmin.save();
    await recordAudit({
      actor: performerName || 'System',
      actorRole: performerRole,
      action: 'created-admin',
      targetId: newAdmin._id,
      targetName: newAdmin.name,
      targetUsername: newAdmin.username,
      targetRole: newAdmin.adminRole,
      details: `Created admin ${newAdmin.username} with role ${newAdmin.adminRole}`,
    });

    res.status(201).json({ message: "Admin account created ✅", admin: { ...newAdmin.toObject(), password: undefined } });
  } catch (error) {
    console.error('Create admin error:', error);
    if (error?.code === 11000) {
      return res.status(400).json({ message: "Duplicate username or phone detected" });
    }
    res.status(500).json({ message: "Server error ❌", error: error.message });
  }
});

// =====================
// Update admin user
// =====================
app.put("/admins/:id", requireAuth, requireRole(ROLE_SUPER_ADMIN, ROLE_ADMIN), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, username, password, email, phone, role, adminType, adminRole, isActive, status, performerRole, performerName } = req.body;

    if (!name || !username || !adminType || !adminRole) {
      return res.status(400).json({ message: "Name, username, access type and admin role are required" });
    }

    if (password && password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    if (performerRole !== 'super-admin') {
      return res.status(403).json({ message: "Only Super Admin can update admin accounts" });
    }

    const admin = await User.findById(id);
    if (!admin || admin.role !== 'admin') {
      return res.status(404).json({ message: "Admin user not found" });
    }

    const existingDuplicate = await User.findOne({
      _id: { $ne: id },
      $or: [{ username }, { phone }],
    });
    if (existingDuplicate) {
      return res.status(400).json({ message: "Username or phone is already registered" });
    }

    admin.name = name;
    admin.username = username;
    if (password) admin.password = password;
    admin.email = email || '';
    admin.phone = phone || null;
    if (typeof isActive === 'boolean') {
      admin.isActive = isActive;
      admin.status = isActive ? 'active' : 'inactive';
    }
    if (role) {
      if (!ADMIN_ROLES.includes(role)) {
        return res.status(400).json({ message: 'Invalid role update' });
      }
      admin.role = role;
    }
    admin.adminType = admin.role === ROLE_ADMIN ? adminType : undefined;
    admin.adminRole = admin.role === ROLE_ADMIN ? adminRole : undefined;
    admin.adminRole = adminRole;
    if (typeof isActive === 'boolean') {
      admin.isActive = isActive;
    }
    await admin.save();

    await recordAudit({
      actor: performerName || 'System',
      actorRole: performerRole,
      action: 'updated-admin',
      targetId: admin._id,
      targetName: admin.name,
      targetUsername: admin.username,
      targetRole: admin.adminRole,
      details: `Updated admin ${admin.username}`,
    });

    const updatedAdmin = admin.toObject();
    delete updatedAdmin.password;
    res.status(200).json({ message: "Admin account updated ✅", admin: updatedAdmin });
  } catch (error) {
    console.error('Update admin error:', error);
    if (error?.code === 11000) {
      return res.status(400).json({ message: "Duplicate username or phone detected" });
    }
    res.status(500).json({ message: "Server error ❌", error: error.message });
  }
});

// =====================
// Delete admin user
// =====================
app.delete("/admins/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { performerRole, performerName } = req.body;

    if (performerRole !== 'super-admin') {
      return res.status(403).json({ message: "Only Super Admin can delete admin accounts" });
    }

    const admin = await User.findById(id);
    if (!admin || admin.role !== 'admin') {
      return res.status(404).json({ message: "Admin user not found" });
    }

    await admin.deleteOne();
    await recordAudit({
      actor: performerName || 'System',
      actorRole: performerRole,
      action: 'deleted-admin',
      targetId: admin._id,
      targetName: admin.name,
      targetUsername: admin.username,
      targetRole: admin.adminRole,
      details: `Deleted admin ${admin.username}`,
    });

    res.status(200).json({ message: "Admin account deleted ✅" });
  } catch (error) {
    console.error('Delete admin error:', error);
    res.status(500).json({ message: "Server error ❌", error: error.message });
  }
});

// =====================
// Activate / deactivate admin user
// =====================
app.patch("/admins/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive, performerRole, performerName } = req.body;

    if (performerRole !== 'super-admin') {
      return res.status(403).json({ message: "Only Super Admin can change admin account status" });
    }
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ message: "isActive must be a boolean" });
    }

    const admin = await User.findById(id);
    if (!admin || admin.role !== 'admin') {
      return res.status(404).json({ message: "Admin user not found" });
    }

    admin.isActive = isActive;
    await admin.save();

    await recordAudit({
      actor: performerName || 'System',
      actorRole: performerRole,
      action: isActive ? 'activated-admin' : 'deactivated-admin',
      targetId: admin._id,
      targetName: admin.name,
      targetUsername: admin.username,
      targetRole: admin.adminRole,
      details: `${isActive ? 'Activated' : 'Deactivated'} admin ${admin.username}`,
    });

    res.status(200).json({ message: `Admin account ${isActive ? 'activated' : 'deactivated'} ✅`, admin: { ...admin.toObject(), password: undefined } });
  } catch (error) {
    console.error('Change admin status error:', error);
    res.status(500).json({ message: "Server error ❌", error: error.message });
  }
});

// =====================
// Admin audit log
// =====================
app.get("/admin-audit", async (req, res) => {
  try {
    const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(100);
    res.status(200).json({ logs });
  } catch (error) {
    console.error('Fetch audit logs error:', error);
    res.status(500).json({ message: "Server error ❌" });
  }
});

// =====================
// Admin passenger list
// =====================
app.get("/passengers", async (req, res) => {
  try {
    const passengers = await User.find({ role: 'passenger' });
    res.status(200).json({ passengers });
  } catch (error) {
    res.status(500).json({ message: "Server error ❌" });
  }
});

// =====================
// Admin driver list
// =====================
app.get("/drivers", async (req, res) => {
  try {
    const drivers = await User.find({ role: 'driver' });
    res.status(200).json({ drivers });
  } catch (error) {
    res.status(500).json({ message: "Server error ❌" });
  }
});

// =====================
// Server Start
// =====================
const PORT = process.env.PORT || 5001;

httpServer.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Stop the conflicting process or set a different PORT.`);
    process.exit(1);
  }
  console.error('Server error', err);
  process.exit(1);
});

httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT} 🚀`);
});