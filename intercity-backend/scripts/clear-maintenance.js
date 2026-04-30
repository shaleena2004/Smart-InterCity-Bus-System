import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/intercityDB";

// Define schemas inside the script to avoid importing issues
const maintenanceTaskSchema = new mongoose.Schema({
  title: String,
  description: String,
  type: String,
  priority: String,
  dueInKm: Number,
  dueDate: Date,
  status: { type: String, default: 'pending' },
  completedAt: Date,
  technician: String,
  incidentId: String
});

const vehicleSchema = new mongoose.Schema({
  vehicleId: String,
  tasks: [maintenanceTaskSchema],
  maintenanceStatus: String
});

const MaintenanceIssue = mongoose.model('MaintenanceIssue', new mongoose.Schema({
  vehicleId: String,
  incidentStatus: String,
  history: Array
}, { strict: false }));

const Vehicle = mongoose.model('Vehicle', vehicleSchema);

async function clearMaintenance() {
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // 1. Clear tasks from all vehicles
    const vehicleResult = await Vehicle.updateMany({}, { 
      $set: { 
        tasks: [],
        maintenanceStatus: 'active'
      } 
    });
    console.log(`Cleared tasks for ${vehicleResult.modifiedCount} vehicles.`);

    // 2. Resolve all pending maintenance issues
    const issueResult = await MaintenanceIssue.updateMany(
      { incidentStatus: { $in: ['pending', 'open', 'in_progress', 'reported'] } },
      { 
        $set: { incidentStatus: 'resolved' },
        $push: { 
          history: {
            status: 'resolved',
            actor: 'System Cleanup',
            actorRole: 'admin',
            comment: 'Manual maintenance clearing requested by user.',
            date: new Date()
          }
        }
      }
    );
    console.log(`Resolved ${issueResult.modifiedCount} maintenance issues.`);

    console.log('Cleanup completed successfully.');
  } catch (err) {
    console.error('Cleanup failed:', err);
  } finally {
    await mongoose.connection.close();
  }
}

clearMaintenance();
