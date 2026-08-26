const mongoose = require('mongoose');

const { Schema } = mongoose;

const attendanceSchema = new Schema(
  {
    society: {
      type: Schema.Types.ObjectId,
      ref: 'Society',
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
    },
    event: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event reference is required'],
    },
    checkInTime: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: {
        values: ['present', 'late', 'submitted'],
        message: '{VALUE} is not a valid attendance status',
      },
      default: 'present',
    },
    submissionUrl: {
      type: String,
      trim: true,
      default: '',
    },
    submissionNotes: {
      type: String,
      trim: true,
      default: '',
      maxlength: [2000, 'Submission notes cannot exceed 2000 characters'],
    },
  },
  {
    timestamps: true,
  }
);

attendanceSchema.index({ user: 1, event: 1 }, { unique: true });
attendanceSchema.index({ society: 1, user: 1 });
attendanceSchema.index({ event: 1 });
attendanceSchema.index({ user: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
