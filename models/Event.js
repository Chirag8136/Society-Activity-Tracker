const mongoose = require('mongoose');
const crypto = require('crypto');

const { Schema } = mongoose;

const MEETING_TYPES = ['Weekly Meeting', 'Orientation', 'Project Meeting'];
const EVENT_TYPES = ['Event', 'Workshop', 'Task'];
const ALL_EVENT_TYPES = [...MEETING_TYPES, ...EVENT_TYPES];

const DEFAULT_POINTS_MAP = {
  'Weekly Meeting': 5,
  'Project Meeting': 5,
  'Orientation': 5,
  'Workshop': 10,
  'Task': 10,
  'Event': 15,
};

const eventSchema = new Schema(
  {
    society: {
      type: Schema.Types.ObjectId,
      ref: 'Society',
      required: [true, 'Society reference is required'],
    },
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    eventType: {
      type: String,
      enum: {
        values: ALL_EVENT_TYPES,
        message: '{VALUE} is not a valid event type',
      },
      required: [true, 'Event type is required'],
    },
    date: {
      type: Date,
      required: [true, 'Event date is required'],
    },
    startTime: {
      type: String,
      trim: true,
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'startTime must be in HH:MM (24hr) format'],
    },
    checkInCode: {
      type: String,
      unique: true,
      uppercase: true,
      trim: true,
      match: [/^[A-Z0-9]{6,10}$/, 'checkInCode must be 6-10 alphanumeric characters'],
    },
    windowExpiresAt: {
      type: Date,
      required: [true, 'Check-in window expiry (windowExpiresAt) is required'],
      validate: {
        validator: function validateWindow(value) {
          return !this.date || value >= this.date;
        },
        message: 'windowExpiresAt cannot be earlier than the event date',
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    points: {
      type: Number,
      min: [0, 'Points cannot be negative'],
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'createdBy (User reference) is required'],
    },
  },
  {
    timestamps: true,
  }
);

eventSchema.index({ society: 1, date: -1 });
eventSchema.index({ society: 1, isActive: 1 });
eventSchema.index({ eventType: 1 });

eventSchema.pre('validate', function applyDefaults(next) {
  if (!this.checkInCode) {
    this.checkInCode = crypto.randomBytes(4).toString('hex').toUpperCase();
  }
  if (this.points === undefined || this.points === null) {
    this.points = DEFAULT_POINTS_MAP[this.eventType] || 5;
  }
  next();
});

eventSchema.statics.MEETING_TYPES = MEETING_TYPES;
eventSchema.statics.EVENT_TYPES = EVENT_TYPES;
eventSchema.statics.ALL_EVENT_TYPES = ALL_EVENT_TYPES;
eventSchema.statics.DEFAULT_POINTS_MAP = DEFAULT_POINTS_MAP;

module.exports = mongoose.model('Event', eventSchema);
