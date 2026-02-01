require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('../config');
const { ROLES, AGENT_TYPES, ADMISSION_STATUS, REFERRAL_SOURCES, GENDERS, RELIGIONS, QUALIFICATIONS, PAYMENT_MODES, PAYER_TYPES, RECEIVER_TYPES } = require('../utils/constants');

const User = require('../models/User');
const Branch = require('../models/Branch');
const College = require('../models/College');
const Course = require('../models/Course');
const Agent = require('../models/Agent');
const Admission = require('../models/Admission');
const Payment = require('../models/Payment');

const seed = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(config.mongodbUri);
    console.log('Connected to MongoDB');

    // Clear existing data
    console.log('Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      Branch.deleteMany({}),
      College.deleteMany({}),
      Course.deleteMany({}),
      Agent.deleteMany({}),
      Admission.deleteMany({}),
      Payment.deleteMany({}),
    ]);

    // Create Branches
    console.log('Creating branches...');
    const branches = await Branch.insertMany([
      {
        name: 'Dubai Main Branch',
        code: 'DXB',
        address: {
          addressLine: '123 Business Bay',
          city: 'Dubai',
          state: 'Dubai',
          country: 'UAE',
          pincode: '00000',
        },
        phone: '+971501234567',
        email: 'dubai@educonsultancy.com',
        isActive: true,
      },
      {
        name: 'Mumbai Branch',
        code: 'MUM',
        address: {
          addressLine: '456 Andheri West',
          city: 'Mumbai',
          state: 'Maharashtra',
          country: 'India',
          pincode: '400053',
        },
        phone: '+912234567890',
        email: 'mumbai@educonsultancy.com',
        isActive: true,
      },
      {
        name: 'Kerala Branch',
        code: 'KRL',
        address: {
          addressLine: '789 MG Road',
          city: 'Kochi',
          state: 'Kerala',
          country: 'India',
          pincode: '682001',
        },
        phone: '+914842567890',
        email: 'kerala@educonsultancy.com',
        isActive: true,
      },
    ]);
    console.log(`Created ${branches.length} branches`);

    // Create Super Admin
    console.log('Creating super admin...');
    const superAdmin = await User.create({
      email: 'superadmin@educonsultancy.com',
      password: 'Admin@123',
      firstName: 'Super',
      lastName: 'Admin',
      phone: '+971501234567',
      role: ROLES.SUPER_ADMIN,
      branches: branches.map(b => b._id),
      isActive: true,
    });
    console.log('Super Admin created');

    // Create Admin
    console.log('Creating admin...');
    const admin = await User.create({
      email: 'admin@educonsultancy.com',
      password: 'Admin@123',
      firstName: 'Branch',
      lastName: 'Admin',
      phone: '+971502345678',
      role: ROLES.ADMIN,
      branches: [branches[0]._id, branches[1]._id],
      isActive: true,
      createdBy: superAdmin._id,
    });
    console.log('Admin created');

    // Create Staff
    console.log('Creating staff...');
    const staff = await User.create({
      email: 'staff@educonsultancy.com',
      password: 'Staff@123',
      firstName: 'John',
      lastName: 'Staff',
      phone: '+971503456789',
      role: ROLES.STAFF,
      branches: [branches[0]._id],
      isActive: true,
      createdBy: admin._id,
    });
    console.log('Staff created');

    // Create Colleges
    console.log('Creating colleges...');
    const colleges = await College.insertMany([
      {
        name: 'University of Mumbai',
        code: 'MU',
        address: {
          addressLine: 'Vidyanagari',
          city: 'Mumbai',
          state: 'Maharashtra',
          country: 'India',
          pincode: '400098',
        },
        phone: '+912226543210',
        email: 'admissions@mu.ac.in',
        website: 'https://mu.ac.in',
        contactPerson: {
          name: 'Dr. Sharma',
          phone: '+912226543211',
          email: 'dr.sharma@mu.ac.in',
          designation: 'Admissions Head',
        },
        isActive: true,
        createdBy: superAdmin._id,
      },
      {
        name: 'Kerala University',
        code: 'KU',
        address: {
          addressLine: 'Thiruvananthapuram',
          city: 'Thiruvananthapuram',
          state: 'Kerala',
          country: 'India',
          pincode: '695034',
        },
        phone: '+914712386789',
        email: 'admissions@ku.ac.in',
        isActive: true,
        createdBy: superAdmin._id,
      },
      {
        name: 'Delhi Technical University',
        code: 'DTU',
        address: {
          addressLine: 'Shahbad Daulatpur',
          city: 'Delhi',
          state: 'Delhi',
          country: 'India',
          pincode: '110042',
        },
        phone: '+911127871018',
        email: 'admissions@dtu.ac.in',
        website: 'https://dtu.ac.in',
        isActive: true,
        createdBy: superAdmin._id,
      },
    ]);
    console.log(`Created ${colleges.length} colleges`);

    // Create Courses
    console.log('Creating courses...');
    const courses = await Course.insertMany([
      {
        name: 'Bachelor of Engineering - Computer Science',
        code: 'BE-CS',
        collegeId: colleges[0]._id,
        duration: { years: 4, description: '4 Years' },
        degree: 'B.E.',
        specialization: 'Computer Science',
        fees: { year1: 150000, year2: 150000, year3: 150000, year4: 150000 },
        hostelFees: { year1: 80000, year2: 80000, year3: 80000, year4: 80000 },
        isActive: true,
        createdBy: superAdmin._id,
      },
      {
        name: 'Bachelor of Business Administration',
        code: 'BBA',
        collegeId: colleges[0]._id,
        duration: { years: 3, description: '3 Years' },
        degree: 'BBA',
        fees: { year1: 100000, year2: 100000, year3: 100000, year4: 0 },
        hostelFees: { year1: 60000, year2: 60000, year3: 60000, year4: 0 },
        isActive: true,
        createdBy: superAdmin._id,
      },
      {
        name: 'Master of Business Administration',
        code: 'MBA',
        collegeId: colleges[1]._id,
        duration: { years: 2, description: '2 Years' },
        degree: 'MBA',
        fees: { year1: 200000, year2: 200000, year3: 0, year4: 0 },
        hostelFees: { year1: 100000, year2: 100000, year3: 0, year4: 0 },
        isActive: true,
        createdBy: superAdmin._id,
      },
      {
        name: 'Bachelor of Technology - Electronics',
        code: 'BTech-EC',
        collegeId: colleges[2]._id,
        duration: { years: 4, description: '4 Years' },
        degree: 'B.Tech',
        specialization: 'Electronics',
        fees: { year1: 180000, year2: 180000, year3: 180000, year4: 180000 },
        hostelFees: { year1: 90000, year2: 90000, year3: 90000, year4: 90000 },
        isActive: true,
        createdBy: superAdmin._id,
      },
    ]);
    console.log(`Created ${courses.length} courses`);

    // Create Agents
    console.log('Creating agents...');
    const agents = await Agent.insertMany([
      {
        name: 'Rajesh Kumar',
        agentType: AGENT_TYPES.MAIN,
        phone: '+919876543210',
        email: 'rajesh@agent.com',
        address: {
          addressLine: '100 Main Street',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001',
        },
        bankDetails: {
          bankName: 'HDFC Bank',
          accountNumber: '1234567890123',
          ifscCode: 'HDFC0001234',
          accountHolderName: 'Rajesh Kumar',
        },
        commissionRate: 10,
        isActive: true,
        createdBy: superAdmin._id,
      },
      {
        name: 'Priya Sharma',
        agentType: AGENT_TYPES.COLLEGE,
        phone: '+919876543211',
        email: 'priya@agent.com',
        linkedColleges: [colleges[0]._id],
        commissionRate: 8,
        isActive: true,
        createdBy: superAdmin._id,
      },
      {
        name: 'Mohammed Ali',
        agentType: AGENT_TYPES.SUB,
        phone: '+971504567890',
        email: 'ali@agent.com',
        address: {
          addressLine: '200 Sheikh Zayed Road',
          city: 'Dubai',
          state: 'Dubai',
        },
        commissionRate: 5,
        isActive: true,
        createdBy: superAdmin._id,
      },
    ]);
    console.log(`Created ${agents.length} agents`);

    // Create Sample Admissions
    console.log('Creating sample admissions...');
    const admissions = await Admission.insertMany([
      {
        admissionDate: new Date('2024-01-15'),
        branchId: branches[0]._id,
        academicYear: '2024-2025',
        admissionStatus: ADMISSION_STATUS.CONFIRMED,
        referralSource: REFERRAL_SOURCES[2], // Agent
        student: {
          firstName: 'Amit',
          lastName: 'Patel',
          email: 'amit.patel@email.com',
          phone: '+919812345678',
          dob: new Date('2000-05-15'),
          gender: GENDERS[0],
          religion: RELIGIONS[0],
          highestQualification: QUALIFICATIONS[1],
          address: {
            state: 'Gujarat',
            district: 'Ahmedabad',
            city: 'Ahmedabad',
            pincode: '380001',
            addressLine: '123 Gandhi Road',
          },
          parentsPhone: '+919812345679',
        },
        collegeId: colleges[0]._id,
        courseId: courses[0]._id,
        agent: {
          agentType: AGENT_TYPES.MAIN,
          agentId: agents[0]._id,
          agentFee: 50000,
        },
        fees: {
          offeredFee: 0,
          admissionFee: 25000,
          tuitionFeeYear1: 150000,
          tuitionFeeYear2: 150000,
          tuitionFeeYear3: 150000,
          tuitionFeeYear4: 150000,
          hostelIncluded: true,
          hostelFeeYear1: 80000,
          hostelFeeYear2: 80000,
          hostelFeeYear3: 80000,
          hostelFeeYear4: 80000,
        },
        serviceCharge: {
          agreed: 75000,
          received: 25000,
        },
        paymentSummary: {
          studentPaid: 175000,
          studentDue: 770000,
          agentPaid: 20000,
          agentDue: 30000,
        },
        createdBy: admin._id,
      },
      {
        admissionDate: new Date('2024-02-20'),
        branchId: branches[0]._id,
        academicYear: '2024-2025',
        admissionStatus: ADMISSION_STATUS.PENDING,
        referralSource: REFERRAL_SOURCES[0], // Website
        student: {
          firstName: 'Sarah',
          lastName: 'Khan',
          email: 'sarah.khan@email.com',
          phone: '+919823456789',
          dob: new Date('2001-08-22'),
          gender: GENDERS[1],
          religion: RELIGIONS[1],
          highestQualification: QUALIFICATIONS[1],
          address: {
            state: 'Maharashtra',
            district: 'Mumbai',
            city: 'Mumbai',
            pincode: '400001',
            addressLine: '456 Marine Drive',
          },
          parentsPhone: '+919823456780',
        },
        collegeId: colleges[1]._id,
        courseId: courses[2]._id,
        fees: {
          offeredFee: 0,
          admissionFee: 15000,
          tuitionFeeYear1: 200000,
          tuitionFeeYear2: 200000,
          hostelIncluded: false,
        },
        serviceCharge: {
          agreed: 40000,
          received: 0,
        },
        paymentSummary: {
          studentPaid: 50000,
          studentDue: 365000,
        },
        createdBy: staff._id,
      },
      {
        admissionDate: new Date('2024-03-10'),
        branchId: branches[1]._id,
        academicYear: '2024-2025',
        admissionStatus: ADMISSION_STATUS.CONFIRMED,
        referralSource: REFERRAL_SOURCES[1], // Social Media
        student: {
          firstName: 'Rahul',
          lastName: 'Verma',
          email: 'rahul.verma@email.com',
          phone: '+919834567890',
          dob: new Date('2000-12-10'),
          gender: GENDERS[0],
          religion: RELIGIONS[0],
          highestQualification: QUALIFICATIONS[2],
          address: {
            state: 'Delhi',
            district: 'New Delhi',
            city: 'New Delhi',
            pincode: '110001',
            addressLine: '789 Connaught Place',
          },
          parentsPhone: '+919834567891',
        },
        collegeId: colleges[2]._id,
        courseId: courses[3]._id,
        agent: {
          agentType: AGENT_TYPES.SUB,
          agentId: agents[2]._id,
          agentFee: 35000,
        },
        fees: {
          offeredFee: 0,
          admissionFee: 20000,
          tuitionFeeYear1: 180000,
          tuitionFeeYear2: 180000,
          tuitionFeeYear3: 180000,
          tuitionFeeYear4: 180000,
          hostelIncluded: true,
          hostelFeeYear1: 90000,
          hostelFeeYear2: 90000,
          hostelFeeYear3: 90000,
          hostelFeeYear4: 90000,
        },
        serviceCharge: {
          agreed: 60000,
          received: 60000,
        },
        paymentSummary: {
          studentPaid: 380000,
          studentDue: 700000,
          agentPaid: 35000,
          agentDue: 0,
        },
        createdBy: admin._id,
      },
    ]);
    console.log(`Created ${admissions.length} admissions`);

    console.log('\n========================================');
    console.log('SEED COMPLETED SUCCESSFULLY!');
    console.log('========================================');
    console.log('\nLogin Credentials:');
    console.log('----------------------------------------');
    console.log('Super Admin:');
    console.log('  Email: superadmin@educonsultancy.com');
    console.log('  Password: Admin@123');
    console.log('----------------------------------------');
    console.log('Admin:');
    console.log('  Email: admin@educonsultancy.com');
    console.log('  Password: Admin@123');
    console.log('----------------------------------------');
    console.log('Staff:');
    console.log('  Email: staff@educonsultancy.com');
    console.log('  Password: Staff@123');
    console.log('========================================\n');

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seed();
