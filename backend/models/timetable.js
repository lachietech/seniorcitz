import mongoose from 'mongoose';

export const defaultTimetable = [
  { day: 'Monday', hours: '8:30 am - 4:30 pm', activities: 'BINGO, Canteen, Bridge' },
  { day: 'Tuesday', hours: '8:30 am - 4:30 pm', activities: 'Mahjong, Exercise Class, Table Tennis' },
  { day: 'Wednesday', hours: '8:30 am - 4:30 pm', activities: 'Morning Tea, Concert, Raffle, Lunch' },
  { day: 'Thursday', hours: '8:30 am - 4:30 pm', activities: 'Exercise Class, Table Tennis' },
  { day: 'Friday', hours: '8:30 am - 4:30 pm', activities: 'Craft' },
  { day: 'Saturday', hours: '8:30 am - 4:30 pm', activities: 'BINGO, Canteen' },
  { day: 'Sunday', hours: 'Closed', activities: 'Closed' }
];

const TimetableEntrySchema = new mongoose.Schema(
  {
    day: { type: String, required: true, trim: true },
    hours: { type: String, required: true, trim: true },
    activities: { type: String, required: true, trim: true }
  },
  { _id: false }
);

const TimetableSchema = new mongoose.Schema({
  entries: {
    type: [TimetableEntrySchema],
    default: defaultTimetable
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

TimetableSchema.statics.getCurrent = async function() {
  const timetable = await this.findOne();
  return timetable?.entries?.length ? timetable.entries : defaultTimetable;
};

export default mongoose.model('Timetable', TimetableSchema);
