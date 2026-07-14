import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 100,
  },
  firstname: {
    type: String,
    trim: true,
    default: '',
    maxlength: 50,
  },
  middlename: {
    type: String,
    trim: true,
    default: '',
    maxlength: 50,
  },
  lastname: {
    type: String,
    trim: true,
    default: '',
    maxlength: 50,
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    minlength: 3,
    maxlength: 30,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  phone: {
    type: String,
    trim: true,
    default: '',
  },
  dob: {
    type: String,
    default: '',
  },
  password: {
    type: String,
    minlength: 6,
    default: null,
    select: false,
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    default: null,
  },
  profilePic: {
    type: String,
    trim: true,
    default: '',
  },
  authProvider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local',
    required: true,
  },
  nationality: {
    type: String,
    trim: true,
    default: '',
  },
  status: {
    type: String,
    enum: ['Student', 'Employed', 'Unemployed'],
    default: 'Student',
  },
  isPremium: {
    type: Boolean,
    default: false,
  },
  isPaid: {
    type: Boolean,
    default: false,
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
}, {
  timestamps: { createdAt: true, updatedAt: true },
});

userSchema.pre('save', async function hashPassword(next) {
  if (!this.password) return next();
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  return next();
});

userSchema.methods.comparePassword = function comparePassword(candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.pre('validate', function syncNameFields(next) {
  const trimmedName = String(this.name || '').trim();
  const first = String(this.firstname || '').trim();
  const middle = String(this.middlename || '').trim();
  const last = String(this.lastname || '').trim();

  if (!trimmedName) {
    this.name = [first, middle, last].filter(Boolean).join(' ').trim();
  }

  if (!first && this.name) {
    const [derivedFirst = '', ...rest] = String(this.name).trim().split(/\s+/);
    this.firstname = derivedFirst;
    if (!this.lastname && rest.length > 0) {
      this.lastname = rest.join(' ');
    }
  }

  if (!this.name) {
    this.name = [this.firstname, this.middlename, this.lastname].filter(Boolean).join(' ').trim();
  }

  return next();
});

userSchema.pre('save', function syncPaidFlags(next) {
  const premiumEnabled = Boolean(this.isPremium || this.isPaid);
  this.isPremium = premiumEnabled;
  this.isPaid = premiumEnabled;
  return next();
});

const User = mongoose.model('User', userSchema);

export default User;
