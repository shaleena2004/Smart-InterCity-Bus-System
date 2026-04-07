import mongoose from 'mongoose';
const MONGO_URI = 'mongodb+srv://shaleena:Shaleena2004@cluster0.5strdts.mongodb.net/intercityDB?appName=Cluster0';
const MaintenanceIssueSchema = new mongoose.Schema({ incidentStatus: String, type: String }, { strict: false });
const MaintenanceIssue = mongoose.model('MaintenanceIssue', MaintenanceIssueSchema, 'maintenanceissues');

async function check() {
  try {
    await mongoose.connect(MONGO_URI);
    const incidents = await MaintenanceIssue.find({ incidentStatus: { $in: ['reported', 'assigned', 'pending'] } });
    console.log('Statuses:', JSON.stringify(incidents.map(i => i.incidentStatus)));
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

check();
