const mongoose = require('mongoose');
const crypto = require('crypto');

const { Schema } = mongoose;

const SOCIETY_CATEGORIES = [
  'Technical',
  'Cultural',
  'Sports',
  'Academic',
  'Social & Outreach',
  'Arts & Media',
  'General',
];

const societySchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Society name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    code: {
      type: String,
      unique: true,
      uppercase: true,
      trim: true,
      match: [/^[A-Z0-9_-]{2,20}$/, 'Code must be 2-20 alphanumeric characters'],
    },
    joinCode: {
      type: String,
      unique: true,
      uppercase: true,
      trim: true,
      match: [/^[A-Z0-9]{6,10}$/, 'joinCode must be 6-10 alphanumeric characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    category: {
      type: String,
      enum: {
        values: SOCIETY_CATEGORIES,
        message: '{VALUE} is not a valid society category',
      },
      default: 'Technical',
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'createdBy is required'],
    },
  },
  {
    timestamps: true,
  }
);

societySchema.pre('validate', function applyDefaults(next) {
  if (!this.joinCode) {
    this.joinCode = crypto.randomBytes(3).toString('hex').toUpperCase();
  }
  if (!this.code) {
    this.code = this.name.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 10) || 'SOC';
  }
  next();
});

societySchema.statics.CATEGORIES = SOCIETY_CATEGORIES;

module.exports = mongoose.model('Society', societySchema);
