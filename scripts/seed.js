require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');

const User = require('../models/User');
const Society = require('../models/Society');
const Membership = require('../models/Membership');
const Event = require('../models/Event');
const Attendance = require('../models/Attendance');
const Contribution = require('../models/Contribution');

const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
};

const seed = async () => {
  try {
    await connectDB();
    console.log('\n🌱 Starting multi-tenant database seed...\n');

    // 1. Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Society.deleteMany({}),
      Membership.deleteMany({}),
      Event.deleteMany({}),
      Attendance.deleteMany({}),
      Contribution.deleteMany({}),
    ]);
    console.log('🧹 Cleared existing data');

    // 2. Create Global Users
    const alex = await User.create({
      name: 'Alex Morgan',
      email: 'admin@society.com',
      password: 'Admin@123',
    });

    const priya = await User.create({
      name: 'Priya Sharma',
      email: 'priya.sharma@society.com',
      password: 'Member@123',
    });

    const james = await User.create({
      name: 'James Chen',
      email: 'james.chen@society.com',
      password: 'Member@123',
    });

    const fatima = await User.create({
      name: 'Fatima Al-Farsi',
      email: 'fatima.alfarsi@society.com',
      password: 'Member@123',
    });

    const daniel = await User.create({
      name: 'Daniel Okafor',
      email: 'daniel.okafor@society.com',
      password: 'Member@123',
    });

    // 3. Create 2 Societies
    const codingClub = await Society.create({
      name: 'Developer & Coding Club',
      code: 'DEVCLUB',
      joinCode: 'DEV123',
      category: 'Technical',
      description: 'Building software projects, hackathons, and open source development.',
      createdBy: alex._id,
    });

    const roboticsSociety = await Society.create({
      name: 'Robotics & AI Society',
      code: 'ROBOTICS',
      joinCode: 'ROB456',
      category: 'Technical',
      description: 'Autonomous robotics, embedded systems, computer vision, and IoT.',
      createdBy: priya._id,
    });

    // 4. Create Memberships
    await Membership.create([
      { user: alex._id, society: codingClub._id, role: 'admin', department: 'Executive', position: 'President' },
      { user: priya._id, society: codingClub._id, role: 'member', department: 'Full Stack', position: 'Lead Developer' },
      { user: james._id, society: codingClub._id, role: 'member', department: 'Design', position: 'UI/UX Designer' },
      { user: fatima._id, society: codingClub._id, role: 'member', department: 'Content', position: 'Technical Writer' },
      { user: daniel._id, society: codingClub._id, role: 'member', department: 'Outreach', position: 'Community Manager' },
    ]);

    await Membership.create([
      { user: priya._id, society: roboticsSociety._id, role: 'admin', department: 'Hardware', position: 'Team Captain' },
      { user: alex._id, society: roboticsSociety._id, role: 'member', department: 'Firmware', position: 'Embedded Dev' },
      { user: james._id, society: roboticsSociety._id, role: 'member', department: 'CAD', position: 'Mechanical Designer' },
      { user: daniel._id, society: roboticsSociety._id, role: 'member', department: 'Electronics', position: 'Circuit Specialist' },
    ]);

    // 5. Create Events for Coding Club (including Workshop, Weekly Meeting, Task)
    const event1 = await Event.create({
      society: codingClub._id,
      title: 'Fullstack Web Workshop',
      eventType: 'Workshop',
      date: daysAgo(14),
      startTime: '17:00',
      windowExpiresAt: new Date(daysAgo(14).getTime() + 60 * 60 * 1000),
      isActive: false,
      points: 10,
      createdBy: alex._id,
    });

    const event2 = await Event.create({
      society: codingClub._id,
      title: 'Sprint Planning & Demo #1',
      eventType: 'Weekly Meeting',
      date: daysAgo(7),
      startTime: '18:00',
      windowExpiresAt: new Date(daysAgo(7).getTime() + 60 * 60 * 1000),
      isActive: false,
      points: 5,
      createdBy: alex._id,
    });

    const taskEvent = await Event.create({
      society: codingClub._id,
      title: 'Task: API Documentation & Testing',
      eventType: 'Task',
      date: daysAgo(2),
      startTime: '12:00',
      windowExpiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
      isActive: true,
      points: 10,
      createdBy: alex._id,
    });

    const activeEvent = await Event.create({
      society: codingClub._id,
      title: 'Hackathon Kickoff Sync',
      eventType: 'Project Meeting',
      date: new Date(),
      startTime: '19:00',
      checkInCode: 'HACK99',
      windowExpiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
      isActive: true,
      points: 5,
      createdBy: alex._id,
    });

    // 6. Create Events for Robotics Society
    const robEvent1 = await Event.create({
      society: roboticsSociety._id,
      title: 'Robot Arm Calibration Session',
      eventType: 'Project Meeting',
      date: daysAgo(5),
      startTime: '16:00',
      windowExpiresAt: new Date(daysAgo(5).getTime() + 60 * 60 * 1000),
      isActive: false,
      points: 5,
      createdBy: priya._id,
    });

    // 7. Attendance records
    await Attendance.create([
      { society: codingClub._id, user: priya._id, event: event1._id, checkInTime: daysAgo(14), status: 'present' },
      { society: codingClub._id, user: james._id, event: event1._id, checkInTime: daysAgo(14), status: 'present' },
      { society: codingClub._id, user: priya._id, event: event2._id, checkInTime: daysAgo(7), status: 'present' },
      { society: codingClub._id, user: fatima._id, event: event2._id, checkInTime: daysAgo(7), status: 'late' },
      { society: codingClub._id, user: priya._id, event: taskEvent._id, checkInTime: daysAgo(2), status: 'present' },
      { society: roboticsSociety._id, user: alex._id, event: robEvent1._id, checkInTime: daysAgo(5), status: 'present' },
    ]);

    // 8. Contribution records
    await Contribution.create([
      {
        society: codingClub._id,
        user: priya._id,
        title: 'Built the Society Activity Tracker frontend',
        description: 'Implemented React UI with Tailwind and Recharts',
        category: 'Technical',
        points: 15,
        date: daysAgo(10),
        loggedBy: alex._id,
      },
      {
        society: codingClub._id,
        user: james._id,
        title: 'Designed Club Logo and UI Mockups',
        category: 'Design',
        points: 15,
        date: daysAgo(8),
        loggedBy: alex._id,
      },
      {
        society: roboticsSociety._id,
        user: alex._id,
        title: 'Programmed motor driver firmware',
        category: 'Technical',
        points: 15,
        date: daysAgo(3),
        loggedBy: priya._id,
      },
    ]);

    console.log('✅ Multi-tenant seed complete with Task event support!');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
};

seed();
