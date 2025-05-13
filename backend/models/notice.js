import mongoose from 'mongoose';

const NoticeSchema = new mongoose.Schema({
  title: String,
  content: String,
  image: {
    data: Buffer,
    contentType: String
  },
  postedAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Notice', NoticeSchema);