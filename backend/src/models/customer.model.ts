import mongoose, { Schema, Document } from 'mongoose';

export interface ICustomer extends Document {
  name: string;
  contact: string;
  address: string;
  status: 'Active' | 'Lead' | 'Inactive';
  lastTransaction?: Date;
  totalSpent?: number;
  email?: string;
  phone?: string;
  company?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSchema: Schema = new Schema({
  name: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true
  },
  contact: {
    type: String,
    required: [true, 'Contact information is required'],
    trim: true
  },
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true
  },
  status: {
    type: String,
    enum: ['Active', 'Lead', 'Inactive'],
    default: 'Lead'
  },
  lastTransaction: {
    type: Date
  },
  totalSpent: {
    type: Number,
    min: 0
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    trim: true
  },
  company: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Add indexes for better query performance
CustomerSchema.index({ name: 1 });
CustomerSchema.index({ email: 1 });
CustomerSchema.index({ status: 1 });
CustomerSchema.index({ createdAt: -1 });

export default mongoose.model<ICustomer>('Customer', CustomerSchema);
