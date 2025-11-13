const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const path = require('path');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:5174'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(session({
    secret: 'crm-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false,
        maxAge: 24 * 60 * 60 * 1000,
        httpOnly: false
    }
}));


const MONGODB_URI = 'mongodb://127.0.0.1:27017/crmdb';

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    console.log('💡 Please make sure MongoDB is running on your system');
    console.log('💡 You can install MongoDB from: https://www.mongodb.com/try/download/community');
    console.log('💡 Or use MongoDB Atlas cloud service');
});

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    role: {
        type: String,
        enum: ['admin', 'user'],
        default: 'user'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const contactSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        trim: true
    },
    lastName: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    phone: {
        type: String,
        required: true,
        trim: true
    },
    company: {
        type: String,
        trim: true
    },
    jobTitle: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        enum: ['lead', 'opportunity', 'customer', 'closed'],
        default: 'lead'
    },
    source: {
        type: String,
        enum: ['website', 'referral', 'social_media', 'cold_call', 'other'],
        default: 'other'
    },
    notes: {
        type: String,
        trim: true
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

const activitySchema = new mongoose.Schema({
    contactId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Contact',
        required: true
    },
    type: {
        type: String,
        enum: ['call', 'email', 'meeting', 'note', 'task'],
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    dueDate: {
        type: Date
    },
    completed: {
        type: Boolean,
        default: false
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const User = mongoose.model('User', userSchema);
const Contact = mongoose.model('Contact', contactSchema);
const Activity = mongoose.model('Activity', activitySchema);

const requireAuth = (req, res, next) => {
    if (req.session && req.session.userId) {
        next();
    } else {
        res.status(401).json({ error: 'Authentication required. Please login.' });
    }
};

const initializeAdmin = async () => {
    try {
        const adminExists = await User.findOne({ email: 'admin@crm.com' });
        if (!adminExists) {
            const hashedPassword = await bcrypt.hash('admin123', 10);
            const admin = new User({
                name: 'System Administrator',
                email: 'admin@crm.com',
                password: hashedPassword,
                role: 'admin'
            });
            await admin.save();
            console.log('✅ Admin user created successfully');
            console.log('📧 Email: admin@crm.com');
            console.log('🔑 Password: admin123');
        } else {
            console.log('✅ Admin user already exists');
        }
    } catch (error) {
        console.error('❌ Error initializing admin:', error.message);
    }
};

app.get('/api/health', (req, res) => {
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    res.json({
        status: 'Server is running',
        timestamp: new Date().toISOString(),
        database: dbStatus,
        port: PORT
    });
});

app.post('/api/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters long' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'User with this email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ name, email, password: hashedPassword });
        await user.save();

        req.session.userId = user._id;
        req.session.userEmail = user.email;
        req.session.userName = user.name;
        req.session.userRole = user.role;

        res.status(201).json({
            message: 'User registered successfully',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

      
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }

    
        req.session.userId = user._id;
        req.session.userEmail = user.email;
        req.session.userName = user.name;
        req.session.userRole = user.role;

        res.json({
            message: 'Login successful',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Could not log out' });
        }
        res.json({ message: 'Logout successful' });
    });
});


app.get('/api/user', requireAuth, (req, res) => {
    res.json({
        user: {
            id: req.session.userId,
            name: req.session.userName,
            email: req.session.userEmail,
            role: req.session.userRole
        }
    });
});


app.get('/api/contacts', requireAuth, async (req, res) => {
    try {
        const contacts = await Contact.find({ createdBy: req.session.userId })
            .sort({ createdAt: -1 })
            .populate('assignedTo', 'name email');

        res.json({ contacts });
    } catch (error) {
        console.error('Get contacts error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/contacts', requireAuth, async (req, res) => {
    try {
        const { firstName, lastName, email, phone, company, jobTitle, status, source, notes } = req.body;

     
        if (!firstName || !lastName || !email || !phone) {
            return res.status(400).json({ error: 'First name, last name, email, and phone are required' });
        }

        const contact = new Contact({
            firstName,
            lastName,
            email,
            phone,
            company,
            jobTitle,
            status,
            source,
            notes,
            createdBy: req.session.userId
        });

        await contact.save();
        await contact.populate('assignedTo', 'name email');

        res.status(201).json({
            message: 'Contact created successfully',
            contact
        });
    } catch (error) {
        console.error('Create contact error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/contacts/:id', requireAuth, async (req, res) => {
    try {
        const contact = await Contact.findOne({
            _id: req.params.id,
            createdBy: req.session.userId
        }).populate('assignedTo', 'name email');

        if (!contact) {
            return res.status(404).json({ error: 'Contact not found' });
        }

        res.json({ contact });
    } catch (error) {
        console.error('Get contact error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.put('/api/contacts/:id', requireAuth, async (req, res) => {
    try {
        const contact = await Contact.findOneAndUpdate(
            { 
                _id: req.params.id, 
                createdBy: req.session.userId 
            },
            { 
                ...req.body,
                updatedAt: new Date()
            },
            { new: true }
        ).populate('assignedTo', 'name email');

        if (!contact) {
            return res.status(404).json({ error: 'Contact not found' });
        }

        res.json({
            message: 'Contact updated successfully',
            contact
        });
    } catch (error) {
        console.error('Update contact error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.delete('/api/contacts/:id', requireAuth, async (req, res) => {
    try {
        const contact = await Contact.findOneAndDelete({
            _id: req.params.id,
            createdBy: req.session.userId
        });

        if (!contact) {
            return res.status(404).json({ error: 'Contact not found' });
        }

        res.json({ message: 'Contact deleted successfully' });
    } catch (error) {
        console.error('Delete contact error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/dashboard/stats', requireAuth, async (req, res) => {
  try {
    const totalContacts = await Contact.countDocuments({ 
      createdBy: req.session.userId 
    });
    
    // Fixed: Use new mongoose.Types.ObjectId()
    const contactsByStatus = await Contact.aggregate([
      { $match: { createdBy: new mongoose.Types.ObjectId(req.session.userId) } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    res.json({
      totalContacts,
      contactsByStatus
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, async () => {
    console.log(`🚀 CRM Server is running on http://localhost:${PORT}`);
    console.log('📊 Health check: http://localhost:3000/api/health');
    console.log('⏳ Initializing admin user...');
    
    setTimeout(async () => {
        await initializeAdmin();
    }, 1000);
});