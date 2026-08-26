const mongoose = require('mongoose');

const { Schema } = mongoose;

const membershipSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
    },
    society: {
      type: Schema.Types.ObjectId,
      ref: 'Society',
      required: [true, 'Society reference is required'],
    },
    role: {
      type: String,
      enum: {
        values: ['member', 'admin'],
        message: '{VALUE} is not a valid role',
      },
      default: 'member',
    },
    department: {
      type: String,
      trim: true,
      default: '',
    },
    position: {
      type: String,
      trim: true,
      default: '',
    },
    joiningDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: {
        values: ['active', 'inactive'],
        message: '{VALUE} is not a valid status',
      },
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

membershipSchema.index({ user: 1, society: 1 }, { unique: true });
membershipSchema.index({ society: 1, role: 1 });
membershipSchema.index({ society: 1, status: 1 });

module.exports = mongoose.model('Membership', membershipSchema);
