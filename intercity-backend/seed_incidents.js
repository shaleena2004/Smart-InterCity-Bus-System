import mongoose from 'mongoose';

const MONGO_URI = "mongodb+srv://shaleena:Shaleena2004@cluster0.5strdts.mongodb.net/intercityDB?appName=Cluster0";

const MaintenanceIssueSchema = new mongoose.Schema({
  vehicleId: String,
  type: String,
  description: String,
  location: String,
  priority: String,
  reporter: String,
  incidentStatus: String,
  history: Array,
}, { timestamps: true });

const MaintenanceIssue = mongoose.model('MaintenanceIssue', MaintenanceIssueSchema, 'maintenanceissues');

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to DB');

    const sampleIncidents = [
      {
        vehicleId: 'bus-8824',
        type: 'Engine Overheating',
        description: 'Engine temperature rising rapidly on uphill climbs.',
        location: 'Kaduwela Interchange',
        priority: 'high',
        reporter: '0771319366',
        incidentStatus: 'reported',
        history: [{ status: 'reported', actor: '0771319366', actorRole: 'driver', comment: 'Incident reported', date: new Date() }]
      },
      {
        vehicleId: 'bus-1122',
        type: 'AC Leakage',
        description: 'Water dripping from the overhead vents in the rear.',
        location: 'Main Terminal',
        priority: 'medium',
        reporter: '0771122334',
        incidentStatus: 'reported',
        history: [{ status: 'reported', actor: '0771122334', actorRole: 'driver', comment: 'Incident reported', date: new Date() }]
      }
    ];

    await MaintenanceIssue.insertMany(sampleIncidents);
    console.log('Sample incidents seeded ✅');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();
