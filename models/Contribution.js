const mongoose = require('mongoose');

const { Schema } = mongoose;

const CONTRIBUTION_CATEGORIES = [
  'Technical',
  'Design',
  'Content',
  'Management',
  'Outreach',
  'Event Operations',
];

const contributionSchema = new Schema(
  {
    society: {
      type: Schema.Types.ObjectId,
      ref: 'Society',
      required: [true, 'Society reference is required'],
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
    },
    title: {
      type: String,
      required: [true, 'Contribution title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    category: {
      type: String,
      enum: {
        values: CONTRIBUTION_CATEGORIES,
        message: '{VALUE} is not a valid contribution category',
      },
      required: [true, 'Category is required'],
    },
    points: {
      type: Number,
      required: [true, 'Points are required'],
      min: [0, 'Points cannot be negative'],
    },
    date: {
      type: Date,
      default: Date.now,
    },
    loggedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'loggedBy (User reference) is required'],
    },
  },
  {
    timestamps: true,
  }
);

contributionSchema.index({ society: 1, user: 1 });
contributionSchema.index({ society: 1, category: 1 });
contributionSchema.index({ society: 1, date: -1 });

contributionSchema.statics.CATEGORIES = CONTRIBUTION_CATEGORIES;

module.exports = mongoose.model('Contribution', contributionSchema);
