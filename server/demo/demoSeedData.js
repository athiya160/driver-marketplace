/**
 * PERSONAL DRIVER MARKETPLACE - DEDICATED SYNTHETIC DEMO SEED DATA
 * Fictional Indian demonstration dataset for founder, investor & partner walkthroughs
 * All data is synthetic, simulated, and strictly isolated from production.
 * Value Proposition: "Your Car. Your Journey. Your Driver."
 */

// 1. SAMPLE CUSTOMERS (18 Fictional Vehicle Owners across India)
export const DEMO_CUSTOMERS = [
  {
    id: 'demo_cust_01',
    fullName: 'Rohan Sharma (Demo)',
    phone: '+91 98765 00001',
    email: 'rohan.sharma.demo@example.com',
    role: 'customer',
    homeCity: 'Bengaluru',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80',
    vehicles: [
      { id: 'v_101', make: 'Honda', model: 'City ZX', type: 'Sedan', transmission: 'Automatic', regNo: 'KA-01-DM-1001', year: 2023, color: 'Platinum White' },
      { id: 'v_102', make: 'Hyundai', model: 'i20 Asta', type: 'Hatchback', transmission: 'Manual', regNo: 'KA-01-DM-1002', year: 2021, color: 'Fiery Red' }
    ],
    savedAddresses: [
      { id: 'addr_b_1', title: 'Home', address: '100ft Road, 4th Block, Indiranagar', city: 'Bengaluru', pinCode: '560038' },
      { id: 'addr_b_2', title: 'Office', address: 'Prestige Tech Park, Marathahalli-Sarjapur Outer Ring Road', city: 'Bengaluru', pinCode: '560103' },
      { id: 'addr_b_3', title: 'Airport', address: 'Kempegowda International Airport Terminal 2', city: 'Bengaluru', pinCode: '560300' }
    ],
    favoriteDriverIds: ['demo_drv_blr_1', 'demo_drv_blr_2'],
    totalBookingsCount: 8,
    totalSpent: 12480,
    status: 'active'
  },
  {
    id: 'demo_cust_02',
    fullName: 'Priya Sundaram (Demo)',
    phone: '+91 98765 00002',
    email: 'priya.sundaram.demo@example.com',
    role: 'customer',
    homeCity: 'Bengaluru',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=160&q=80',
    vehicles: [
      { id: 'v_103', make: 'BMW', model: '3 Series Gran Limousine', type: 'Luxury', transmission: 'Automatic', regNo: 'KA-03-DM-2003', year: 2024, color: 'Carbon Black' }
    ],
    savedAddresses: [
      { id: 'addr_b_4', title: 'Home', address: 'Palm Meadows, Varthur Road, Whitefield', city: 'Bengaluru', pinCode: '560066' }
    ],
    favoriteDriverIds: ['demo_drv_blr_3'],
    totalBookingsCount: 14,
    totalSpent: 26800,
    status: 'active'
  },
  {
    id: 'demo_cust_03',
    fullName: 'Vikram Malhotra (Demo)',
    phone: '+91 98765 00003',
    email: 'vikram.m.demo@example.com',
    role: 'customer',
    homeCity: 'Delhi NCR',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80',
    vehicles: [
      { id: 'v_104', make: 'Toyota', model: 'Fortuner Legender', type: 'SUV', transmission: 'Automatic', regNo: 'DL-1C-DM-3004', year: 2023, color: 'Pearl White' }
    ],
    savedAddresses: [
      { id: 'addr_d_1', title: 'Home', address: 'The Crest, DLF Phase 5, Golf Course Road', city: 'Delhi NCR', pinCode: '122002' }
    ],
    favoriteDriverIds: ['demo_drv_del_1'],
    totalBookingsCount: 19,
    totalSpent: 34200,
    status: 'active'
  },
  {
    id: 'demo_cust_04',
    fullName: 'Ananya Sen (Demo)',
    phone: '+91 98765 00004',
    email: 'ananya.sen.demo@example.com',
    role: 'customer',
    homeCity: 'Mumbai',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=160&q=80',
    vehicles: [
      { id: 'v_105', make: 'Kia', model: 'Seltos GTX+', type: 'SUV', transmission: 'Automatic', regNo: 'MH-02-DM-4005', year: 2022, color: 'Gravity Grey' }
    ],
    savedAddresses: [
      { id: 'addr_m_1', title: 'Home', address: 'Bandra West, Pali Hill', city: 'Mumbai', pinCode: '400050' }
    ],
    favoriteDriverIds: ['demo_drv_mum_1'],
    totalBookingsCount: 6,
    totalSpent: 9200,
    status: 'active'
  },
  {
    id: 'demo_cust_05',
    fullName: 'Aditya Kulkarni (Demo)',
    phone: '+91 98765 00005',
    email: 'aditya.k.demo@example.com',
    role: 'customer',
    homeCity: 'Pune',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80',
    vehicles: [
      { id: 'v_106', make: 'Skoda', model: 'Slavia 1.5 TSI', type: 'Sedan', transmission: 'Manual', regNo: 'MH-12-DM-5006', year: 2023, color: 'Tornado Red' }
    ],
    savedAddresses: [
      { id: 'addr_p_1', title: 'Home', address: 'Kalyani Nagar, East Avenue', city: 'Pune', pinCode: '411006' }
    ],
    favoriteDriverIds: [],
    totalBookingsCount: 4,
    totalSpent: 5600,
    status: 'active'
  },
  {
    id: 'demo_cust_06',
    fullName: 'Kavita Reddy (Demo)',
    phone: '+91 98765 00006',
    email: 'kavita.reddy.demo@example.com',
    role: 'customer',
    homeCity: 'Hyderabad',
    avatarUrl: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=160&q=80',
    vehicles: [
      { id: 'v_107', make: 'Mercedes-Benz', model: 'GLC 300', type: 'Luxury', transmission: 'Automatic', regNo: 'TS-09-DM-6007', year: 2024, color: 'Selenite Grey' }
    ],
    savedAddresses: [
      { id: 'addr_h_1', title: 'Home', address: 'Jubilee Hills, Road No. 36', city: 'Hyderabad', pinCode: '560033' }
    ],
    favoriteDriverIds: [],
    totalBookingsCount: 11,
    totalSpent: 21900,
    status: 'active'
  },
  {
    id: 'demo_cust_07',
    fullName: 'Arvind Swaminathan (Demo)',
    phone: '+91 98765 00007',
    email: 'arvind.s.demo@example.com',
    role: 'customer',
    homeCity: 'Chennai',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=160&q=80',
    vehicles: [
      { id: 'v_108', make: 'Tata', model: 'Nexon EV Empowered', type: 'SUV', transmission: 'Automatic', regNo: 'TN-09-DM-7008', year: 2023, color: 'Daytona Grey' }
    ],
    savedAddresses: [
      { id: 'addr_c_1', title: 'Home', address: 'Boat Club Road, R.A. Puram', city: 'Chennai', pinCode: '600028' }
    ],
    favoriteDriverIds: [],
    totalBookingsCount: 7,
    totalSpent: 10400,
    status: 'active'
  },
  {
    id: 'demo_cust_08',
    fullName: 'Deepak Singhal (Demo)',
    phone: '+91 98765 00008',
    email: 'deepak.singhal.demo@example.com',
    role: 'customer',
    homeCity: 'Jaipur',
    avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=160&q=80',
    vehicles: [
      { id: 'v_109', make: 'Mahindra', model: 'XUV700 AX7L', type: 'SUV', transmission: 'Automatic', regNo: 'RJ-14-DM-8009', year: 2023, color: 'Midnight Black' }
    ],
    savedAddresses: [
      { id: 'addr_j_1', title: 'Home', address: 'C-Scheme, Ashok Nagar', city: 'Jaipur', pinCode: '302001' }
    ],
    favoriteDriverIds: [],
    totalBookingsCount: 3,
    totalSpent: 4800,
    status: 'active'
  },
  {
    id: 'demo_cust_09',
    fullName: 'Meera Nambiar (Demo)',
    phone: '+91 98765 00009',
    email: 'meera.nambiar.demo@example.com',
    role: 'customer',
    homeCity: 'Bengaluru',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80',
    vehicles: [
      { id: 'v_110', make: 'Maruti Suzuki', model: 'Baleno Alpha', type: 'Hatchback', transmission: 'Manual', regNo: 'KA-05-DM-9010', year: 2022, color: 'Nexa Blue' }
    ],
    savedAddresses: [
      { id: 'addr_b_5', title: 'Home', address: 'JP Nagar 3rd Phase', city: 'Bengaluru', pinCode: '560078' }
    ],
    favoriteDriverIds: [],
    totalBookingsCount: 5,
    totalSpent: 7100,
    status: 'active'
  },
  {
    id: 'demo_cust_10',
    fullName: 'Siddharth Roy (Demo)',
    phone: '+91 98765 00010',
    email: 'siddharth.roy.demo@example.com',
    role: 'customer',
    homeCity: 'Kolkata',
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=160&q=80',
    vehicles: [
      { id: 'v_111', make: 'Volkswagen', model: 'Taigun GT Plus', type: 'SUV', transmission: 'Automatic', regNo: 'WB-02-DM-1011', year: 2023, color: 'Curcuma Yellow' }
    ],
    savedAddresses: [
      { id: 'addr_k_1', title: 'Home', address: 'Alipore Park Road', city: 'Kolkata', pinCode: '700027' }
    ],
    favoriteDriverIds: [],
    totalBookingsCount: 9,
    totalSpent: 13500,
    status: 'active'
  },
  {
    id: 'demo_cust_11',
    fullName: 'Harsh Vardhan (Demo)',
    phone: '+91 98765 00011',
    email: 'harsh.v.demo@example.com',
    role: 'customer',
    homeCity: 'Delhi NCR',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80',
    vehicles: [{ id: 'v_112', make: 'Audi', model: 'A6 Matrix', type: 'Luxury', transmission: 'Automatic', regNo: 'DL-3C-DM-1012', year: 2023, color: 'Mythos Black' }],
    savedAddresses: [],
    totalBookingsCount: 12,
    totalSpent: 22100,
    status: 'active'
  },
  {
    id: 'demo_cust_12',
    fullName: 'Smita Deshmukh (Demo)',
    phone: '+91 98765 00012',
    email: 'smita.d.demo@example.com',
    role: 'customer',
    homeCity: 'Mumbai',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=160&q=80',
    vehicles: [{ id: 'v_113', make: 'Kia', model: 'Carens Luxury Plus', type: 'SUV', transmission: 'Automatic', regNo: 'MH-01-DM-1013', year: 2024, color: 'Imperial Blue' }],
    savedAddresses: [],
    totalBookingsCount: 2,
    totalSpent: 2400,
    status: 'active'
  },
  {
    id: 'demo_cust_13',
    fullName: 'Rahul Bhatnagar (Demo)',
    phone: '+91 98765 00013',
    email: 'rahul.b.demo@example.com',
    role: 'customer',
    homeCity: 'Chandigarh',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80',
    vehicles: [{ id: 'v_114', make: 'MG', model: 'Hector Sharp Pro', type: 'SUV', transmission: 'Automatic', regNo: 'CH-01-DM-1014', year: 2023, color: 'Starry Black' }],
    savedAddresses: [],
    totalBookingsCount: 5,
    totalSpent: 7900,
    status: 'active'
  },
  {
    id: 'demo_cust_14',
    fullName: 'Pooja Agarwal (Demo)',
    phone: '+91 98765 00014',
    email: 'pooja.a.demo@example.com',
    role: 'customer',
    homeCity: 'Lucknow',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=160&q=80',
    vehicles: [{ id: 'v_115', make: 'Hyundai', model: 'Verna SX(O)', type: 'Sedan', transmission: 'Automatic', regNo: 'UP-32-DM-1015', year: 2023, color: 'Titan Grey' }],
    savedAddresses: [],
    totalBookingsCount: 3,
    totalSpent: 4100,
    status: 'active'
  },
  {
    id: 'demo_cust_15',
    fullName: 'Karthik Raman (Demo)',
    phone: '+91 98765 00015',
    email: 'karthik.r.demo@example.com',
    role: 'customer',
    homeCity: 'Bengaluru',
    avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=160&q=80',
    vehicles: [{ id: 'v_116', make: 'Tata', model: 'Harrier Fearless', type: 'SUV', transmission: 'Automatic', regNo: 'KA-04-DM-1016', year: 2024, color: 'Sunlit Yellow' }],
    savedAddresses: [],
    totalBookingsCount: 7,
    totalSpent: 11200,
    status: 'active'
  },
  {
    id: 'demo_cust_16',
    fullName: 'Neha Kapoor (Demo)',
    phone: '+91 98765 00016',
    email: 'neha.k.demo@example.com',
    role: 'customer',
    homeCity: 'Delhi NCR',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80',
    vehicles: [{ id: 'v_117', make: 'Jeep', model: 'Compass Limited', type: 'SUV', transmission: 'Automatic', regNo: 'HR-26-DM-1017', year: 2022, color: 'Exotica Red' }],
    savedAddresses: [],
    totalBookingsCount: 15,
    totalSpent: 28900,
    status: 'active'
  },
  {
    id: 'demo_cust_17',
    fullName: 'Gautam Menon (Demo)',
    phone: '+91 98765 00017',
    email: 'gautam.m.demo@example.com',
    role: 'customer',
    homeCity: 'Bengaluru',
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=160&q=80',
    vehicles: [{ id: 'v_118', make: 'Volvo', model: 'XC60 B5', type: 'Luxury', transmission: 'Automatic', regNo: 'KA-01-DM-1018', year: 2023, color: 'Onyx Black' }],
    savedAddresses: [],
    totalBookingsCount: 16,
    totalSpent: 38400,
    status: 'active'
  },
  {
    id: 'demo_cust_18',
    fullName: 'Shalini Saxena (Demo)',
    phone: '+91 98765 00018',
    email: 'shalini.s.demo@example.com',
    role: 'customer',
    homeCity: 'Mumbai',
    avatarUrl: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=160&q=80',
    vehicles: [{ id: 'v_119', make: 'Honda', model: 'Elevate ZX', type: 'SUV', transmission: 'Automatic', regNo: 'MH-03-DM-1019', year: 2024, color: 'Phoenix Orange' }],
    savedAddresses: [],
    totalBookingsCount: 4,
    totalSpent: 6200,
    status: 'active'
  }
];

// 2. SAMPLE CHAUFFEURS (28 Fictional Drivers across Bengaluru, Delhi, Mumbai, etc.)
export const DEMO_DRIVERS = [
  // BENGALURU CHAUFFEURS (Focus for Demo Walkthrough)
  {
    id: 'demo_drv_blr_1',
    fullName: 'Arjun Gowda (Demo)',
    phone: '+91 98111 00001',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    primaryCity: 'Bengaluru',
    experienceYears: 8,
    bio: 'Smooth braking specialist in Bengaluru traffic. Expert with German luxury sedans, electric vehicles (Nexon EV, ZS EV) and manual SUVs.',
    languages: ['Kannada', 'English', 'Hindi'],
    transmissionSkills: ['Manual', 'Automatic'],
    vehicleTypes: ['Hatchback', 'Sedan', 'SUV', 'Luxury'],
    hourlyRate: 159,
    dailyRate: 1299,
    outstationRatePerDay: 1699,
    rating: 4.95,
    totalReviews: 242,
    totalTrips: 1280,
    verificationStatus: 'approved',
    policeVerificationStatus: 'verified',
    isOnline: true,
    currentLatitude: 12.9716, // Near MG Road / Indiranagar
    currentLongitude: 77.5946,
    heading: 45,
    speed: 28,
    payoutUpiId: 'arjun.gowda.demo@okaxis',
    drivingLicenceNo: 'KA-01-2016-DEMO-01',
    aadhaarMasked: 'XXXX-XXXX-1101'
  },
  {
    id: 'demo_drv_blr_2',
    fullName: 'Venkatesh Murthy (Demo)',
    phone: '+91 98111 00002',
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    primaryCity: 'Bengaluru',
    experienceYears: 11,
    bio: 'Airport transfer & outstation specialist (Mysuru, Coorg, Ooty, Chikmagalur). Non-smoker, punctual and courteous.',
    languages: ['Kannada', 'English', 'Tamil', 'Hindi'],
    transmissionSkills: ['Manual', 'Automatic'],
    vehicleTypes: ['Sedan', 'SUV', 'Luxury'],
    hourlyRate: 169,
    dailyRate: 1399,
    outstationRatePerDay: 1799,
    rating: 4.92,
    totalReviews: 318,
    totalTrips: 1840,
    verificationStatus: 'approved',
    policeVerificationStatus: 'verified',
    isOnline: true,
    currentLatitude: 12.9784, // Indiranagar 100ft road
    currentLongitude: 77.6408,
    heading: 90,
    speed: 35,
    payoutUpiId: 'venky.m.demo@okhdfcbank',
    drivingLicenceNo: 'KA-03-2013-DEMO-02',
    aadhaarMasked: 'XXXX-XXXX-2202'
  },
  {
    id: 'demo_drv_blr_3',
    fullName: 'Shweta Manjunath (Demo)',
    photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
    phone: '+91 98111 00003',
    primaryCity: 'Bengaluru',
    experienceYears: 6,
    bio: 'Certified female executive chauffeur. Specializes in luxury German cars (Audi, BMW, Volvo), corporate travel and late-night airport pickups.',
    languages: ['Kannada', 'English', 'Hindi'],
    transmissionSkills: ['Automatic'],
    vehicleTypes: ['Sedan', 'SUV', 'Luxury'],
    hourlyRate: 179,
    dailyRate: 1499,
    outstationRatePerDay: 1899,
    rating: 5.0,
    totalReviews: 184,
    totalTrips: 790,
    verificationStatus: 'approved',
    policeVerificationStatus: 'verified',
    isOnline: true,
    currentLatitude: 12.9352, // Koramangala
    currentLongitude: 77.6245,
    heading: 180,
    speed: 20,
    payoutUpiId: 'shweta.m.demo@icici',
    drivingLicenceNo: 'KA-05-2018-DEMO-03',
    aadhaarMasked: 'XXXX-XXXX-3303'
  },
  {
    id: 'demo_drv_blr_4',
    fullName: 'Prasad Nambiar (Demo)',
    phone: '+91 98111 00004',
    photoUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80',
    primaryCity: 'Bengaluru',
    experienceYears: 9,
    bio: 'Expert in manual gearboxes, hill driving and multi-day outstation road trips. Very calm demeanor.',
    languages: ['Malayalam', 'Kannada', 'English', 'Hindi'],
    transmissionSkills: ['Manual', 'Automatic'],
    vehicleTypes: ['Hatchback', 'Sedan', 'SUV'],
    hourlyRate: 149,
    dailyRate: 1199,
    outstationRatePerDay: 1599,
    rating: 4.88,
    totalReviews: 164,
    totalTrips: 920,
    verificationStatus: 'approved',
    policeVerificationStatus: 'verified',
    isOnline: false,
    currentLatitude: 12.9698,
    currentLongitude: 77.7500,
    payoutUpiId: 'prasad.n.demo@sbi',
    drivingLicenceNo: 'KA-51-2015-DEMO-04',
    aadhaarMasked: 'XXXX-XXXX-4404'
  },

  // DELHI NCR CHAUFFEURS
  {
    id: 'demo_drv_del_1',
    fullName: 'Rajesh Kumar Sharma (Demo)',
    phone: '+91 98111 00005',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    primaryCity: 'Delhi NCR',
    experienceYears: 10,
    bio: 'Veteran highway & city chauffeur. Master of German automatic sedans and Gurgaon Golf Course Road routes.',
    languages: ['Hindi', 'English', 'Punjabi'],
    transmissionSkills: ['Manual', 'Automatic'],
    vehicleTypes: ['Hatchback', 'Sedan', 'SUV', 'Luxury'],
    hourlyRate: 159,
    dailyRate: 1299,
    outstationRatePerDay: 1699,
    rating: 4.94,
    totalReviews: 298,
    totalTrips: 1640,
    verificationStatus: 'approved',
    policeVerificationStatus: 'verified',
    isOnline: true,
    currentLatitude: 28.4595,
    currentLongitude: 77.0266,
    payoutUpiId: 'rajesh.sharma.demo@okaxis',
    drivingLicenceNo: 'DL-04-2014-DEMO-05',
    aadhaarMasked: 'XXXX-XXXX-5505'
  },
  {
    id: 'demo_drv_del_2',
    fullName: 'Harpreet Singh (Demo)',
    phone: '+91 98111 00006',
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    primaryCity: 'Delhi NCR',
    experienceYears: 13,
    bio: 'Overnight highway specialist for Yamuna Expressway, Agra, Jaipur, Chandigarh and Uttarakhand hill routes.',
    languages: ['Punjabi', 'Hindi', 'English'],
    transmissionSkills: ['Manual', 'Automatic'],
    vehicleTypes: ['Sedan', 'SUV', 'Luxury'],
    hourlyRate: 179,
    dailyRate: 1499,
    outstationRatePerDay: 1799,
    rating: 4.96,
    totalReviews: 440,
    totalTrips: 2280,
    verificationStatus: 'approved',
    policeVerificationStatus: 'verified',
    isOnline: true,
    currentLatitude: 28.6139,
    currentLongitude: 77.2090,
    payoutUpiId: 'harpreet.s.demo@okhdfcbank',
    drivingLicenceNo: 'DL-11-2011-DEMO-06',
    aadhaarMasked: 'XXXX-XXXX-6606'
  },

  // MUMBAI CHAUFFEURS
  {
    id: 'demo_drv_mum_1',
    fullName: 'Suresh Patil (Demo)',
    phone: '+91 98111 00007',
    photoUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=200&q=80',
    primaryCity: 'Mumbai',
    experienceYears: 9,
    bio: 'Highly familiar with Sea Link, Eastern Freeway and Pune Expressway. Trusted chauffeur for corporate executives.',
    languages: ['Marathi', 'Hindi', 'English'],
    transmissionSkills: ['Manual', 'Automatic'],
    vehicleTypes: ['Hatchback', 'Sedan', 'SUV', 'Luxury'],
    hourlyRate: 169,
    dailyRate: 1349,
    outstationRatePerDay: 1749,
    rating: 4.89,
    totalReviews: 210,
    totalTrips: 1150,
    verificationStatus: 'approved',
    policeVerificationStatus: 'verified',
    isOnline: true,
    currentLatitude: 19.0760,
    currentLongitude: 72.8777,
    payoutUpiId: 'suresh.p.demo@icici',
    drivingLicenceNo: 'MH-02-2015-DEMO-07',
    aadhaarMasked: 'XXXX-XXXX-7707'
  },
  {
    id: 'demo_drv_mum_2',
    fullName: 'Mahesh Kadam (Demo)',
    phone: '+91 98111 00008',
    photoUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=200&q=80',
    primaryCity: 'Mumbai',
    experienceYears: 7,
    bio: 'Smooth city driving through South Mumbai, BKC and Navi Mumbai. Non-smoker, reliable and punctual.',
    languages: ['Marathi', 'Hindi'],
    transmissionSkills: ['Manual', 'Automatic'],
    vehicleTypes: ['Hatchback', 'Sedan', 'SUV'],
    hourlyRate: 159,
    dailyRate: 1249,
    outstationRatePerDay: 1649,
    rating: 4.82,
    totalReviews: 120,
    totalTrips: 680,
    verificationStatus: 'approved',
    policeVerificationStatus: 'verified',
    isOnline: true,
    currentLatitude: 19.0600,
    currentLongitude: 72.8600,
    payoutUpiId: 'mahesh.k.demo@ybl',
    drivingLicenceNo: 'MH-03-2017-DEMO-08',
    aadhaarMasked: 'XXXX-XXXX-8808'
  },

  // HYDERABAD CHAUFFEURS
  {
    id: 'demo_drv_hyd_1',
    fullName: 'Mohammed Farooq (Demo)',
    phone: '+91 98111 00009',
    photoUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=200&q=80',
    primaryCity: 'Hyderabad',
    experienceYears: 7,
    bio: 'HITEC City, Gachibowli and Rajiv Gandhi International Airport specialist. Disciplined chauffeur with spotless safety record.',
    languages: ['Telugu', 'Urdu', 'Hindi', 'English'],
    transmissionSkills: ['Manual', 'Automatic'],
    vehicleTypes: ['Sedan', 'SUV'],
    hourlyRate: 139,
    dailyRate: 1099,
    outstationRatePerDay: 1549,
    rating: 4.85,
    totalReviews: 160,
    totalTrips: 890,
    verificationStatus: 'approved',
    policeVerificationStatus: 'verified',
    isOnline: true,
    currentLatitude: 17.3850,
    currentLongitude: 78.4867,
    payoutUpiId: 'farooq.hyd.demo@paytm',
    drivingLicenceNo: 'TS-09-2017-DEMO-09',
    aadhaarMasked: 'XXXX-XXXX-9909'
  },

  // PUNE CHAUFFEURS
  {
    id: 'demo_drv_pune_1',
    fullName: 'Ganesh Shinde (Demo)',
    phone: '+91 98111 00010',
    photoUrl: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=200&q=80',
    primaryCity: 'Pune',
    experienceYears: 6,
    bio: 'Specialist in Hinjewadi IT Park commute and Lonavala/Mahabaleshwar outstations. Expert in manual and automatic cars.',
    languages: ['Marathi', 'Hindi'],
    transmissionSkills: ['Manual', 'Automatic'],
    vehicleTypes: ['Hatchback', 'Sedan', 'SUV'],
    hourlyRate: 139,
    dailyRate: 1099,
    outstationRatePerDay: 1549,
    rating: 4.79,
    totalReviews: 110,
    totalTrips: 620,
    verificationStatus: 'approved',
    policeVerificationStatus: 'verified',
    isOnline: true,
    currentLatitude: 18.5204,
    currentLongitude: 73.8567,
    payoutUpiId: 'ganesh.s.demo@kotak',
    drivingLicenceNo: 'MH-12-2018-DEMO-10',
    aadhaarMasked: 'XXXX-XXXX-1010'
  },

  // CHENNAI CHAUFFEURS
  {
    id: 'demo_drv_chn_1',
    fullName: 'Kavitha Murugan (Demo)',
    phone: '+91 98111 00011',
    photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
    primaryCity: 'Chennai',
    experienceYears: 7,
    bio: 'Certified female executive chauffeur. ECR & OMR corporate commute expert. Highly praised for polite demeanor.',
    languages: ['Tamil', 'English', 'Hindi'],
    transmissionSkills: ['Manual', 'Automatic'],
    vehicleTypes: ['Hatchback', 'Sedan', 'SUV'],
    hourlyRate: 169,
    dailyRate: 1399,
    outstationRatePerDay: 1799,
    rating: 5.0,
    totalReviews: 142,
    totalTrips: 710,
    verificationStatus: 'approved',
    policeVerificationStatus: 'verified',
    isOnline: true,
    currentLatitude: 13.0827,
    currentLongitude: 80.2707,
    payoutUpiId: 'kavitha.m.demo@paytm',
    drivingLicenceNo: 'TN-09-2017-DEMO-11',
    aadhaarMasked: 'XXXX-XXXX-1111'
  },

  // PENDING KYC CHAUFFEURS (Queue for Admin Walkthrough)
  {
    id: 'demo_drv_pending_1',
    fullName: 'Santosh Kumar Verma (Demo)',
    phone: '+91 98111 00012',
    photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
    primaryCity: 'Bengaluru',
    experienceYears: 5,
    bio: 'Commercial badge holder awaiting compliance verification. 5 years experience with automatic hatchbacks.',
    languages: ['Hindi', 'Kannada'],
    transmissionSkills: ['Manual', 'Automatic'],
    vehicleTypes: ['Hatchback', 'Sedan'],
    hourlyRate: 139,
    dailyRate: 1099,
    outstationRatePerDay: 1499,
    rating: 0.0,
    totalReviews: 0,
    totalTrips: 0,
    verificationStatus: 'pending', // Awaiting Admin KYC approval in demo
    policeVerificationStatus: 'pending',
    isOnline: false,
    currentLatitude: 12.9800,
    currentLongitude: 77.6000,
    payoutUpiId: 'santosh.v.demo@airtel',
    drivingLicenceNo: 'KA-01-2019-DEMO-12',
    aadhaarMasked: 'XXXX-XXXX-1212'
  },
  {
    id: 'demo_drv_pending_2',
    fullName: 'Dinesh Chandra Yadav (Demo)',
    phone: '+91 98111 00013',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    primaryCity: 'Delhi NCR',
    experienceYears: 4,
    bio: 'Seeking commercial onboarding verification. Commercial LMV license holder.',
    languages: ['Hindi'],
    transmissionSkills: ['Manual'],
    vehicleTypes: ['Hatchback', 'Sedan'],
    hourlyRate: 129,
    dailyRate: 999,
    outstationRatePerDay: 1449,
    rating: 0.0,
    totalReviews: 0,
    totalTrips: 0,
    verificationStatus: 'pending',
    policeVerificationStatus: 'pending',
    isOnline: false,
    currentLatitude: 28.5000,
    currentLongitude: 77.1000,
    payoutUpiId: 'dinesh.y.demo@upi',
    drivingLicenceNo: 'UP-16-2020-DEMO-13',
    aadhaarMasked: 'XXXX-XXXX-1313'
  },
  {
    id: 'demo_drv_rejected_1',
    fullName: 'Kishore Bhosle (Demo)',
    phone: '+91 98111 00014',
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    primaryCity: 'Pune',
    experienceYears: 3,
    bio: 'Application rejected due to expired commercial badge.',
    languages: ['Marathi', 'Hindi'],
    transmissionSkills: ['Manual'],
    vehicleTypes: ['Hatchback'],
    hourlyRate: 120,
    dailyRate: 950,
    outstationRatePerDay: 1350,
    rating: 0.0,
    totalReviews: 0,
    totalTrips: 0,
    verificationStatus: 'rejected',
    policeVerificationStatus: 'rejected',
    rejectionReason: 'Commercial driving license expired on 15 Oct 2026',
    isOnline: false,
    currentLatitude: 18.5000,
    currentLongitude: 73.8000,
    payoutUpiId: 'kishore.b.demo@upi',
    drivingLicenceNo: 'MH-14-2018-DEMO-14',
    aadhaarMasked: 'XXXX-XXXX-1414'
  }
];

// 3. SAMPLE KYC COMPLIANCE DOCUMENTS
export const DEMO_DOCUMENTS = [
  {
    id: 'demo_doc_01',
    driverId: 'demo_drv_pending_1',
    driverName: 'Santosh Kumar Verma (Demo)',
    docType: 'Commercial Driving Licence (LMV-CAB)',
    docNumber: 'KA-01-2019-DEMO-12',
    fileUrl: 'https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?auto=format&fit=crop&w=400&q=80',
    status: 'pending',
    uploadedAt: '2026-11-01T10:30:00Z'
  },
  {
    id: 'demo_doc_02',
    driverId: 'demo_drv_pending_1',
    driverName: 'Santosh Kumar Verma (Demo)',
    docType: 'Aadhaar Card (UIDAI QR Masked)',
    docNumber: 'XXXX-XXXX-1212',
    fileUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=400&q=80',
    status: 'pending',
    uploadedAt: '2026-11-01T10:32:00Z'
  },
  {
    id: 'demo_doc_03',
    driverId: 'demo_drv_pending_1',
    driverName: 'Santosh Kumar Verma (Demo)',
    docType: 'Police Clearance Certificate (PCC Karnataka)',
    docNumber: 'PCC-BLR-2026-88912',
    fileUrl: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=400&q=80',
    status: 'pending',
    uploadedAt: '2026-11-01T10:35:00Z'
  },
  {
    id: 'demo_doc_04',
    driverId: 'demo_drv_pending_2',
    driverName: 'Dinesh Chandra Yadav (Demo)',
    docType: 'Commercial Driving Licence',
    docNumber: 'UP-16-2020-DEMO-13',
    fileUrl: 'https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?auto=format&fit=crop&w=400&q=80',
    status: 'pending',
    uploadedAt: '2026-11-02T14:10:00Z'
  }
];

// 4. SAMPLE BOOKINGS (32 Realistic Bookings across India across all lifecycles)
export const DEMO_BOOKINGS = [
  // Active in-progress trip (For live-tracking customer demo)
  {
    id: 'demo_bk_01',
    bookingReference: 'CHAUFFEUR-2026-8821',
    customerId: 'demo_cust_01',
    customerName: 'Rohan Sharma (Demo)',
    customerPhone: '+91 98765 00001',
    driverId: 'demo_drv_blr_1',
    driverName: 'Arjun Gowda (Demo)',
    driverPhone: '+91 98111 00001',
    serviceType: 'hourly',
    serviceTitle: 'Hourly Chauffeur Rental (4 Hours)',
    transmissionType: 'Automatic',
    vehicleType: 'Sedan',
    customerCar: 'Honda City ZX (Automatic) • KA-01-DM-1001',
    pickupAddress: '100ft Road, 4th Block, Indiranagar, Bengaluru',
    pickupCity: 'Bengaluru',
    pickupLatitude: 12.9784,
    pickupLongitude: 77.6408,
    dropAddress: 'Prestige Tech Park, Marathahalli-Sarjapur Outer Ring Road, Bengaluru',
    dropLatitude: 12.9352,
    dropLongitude: 77.6945,
    startDate: '2026-11-03',
    startTime: '14:30',
    durationHours: 4,
    status: 'in_progress', // Active right now on meter
    tripStartOtp: '4821',
    tripQrPayload: 'CHAUFFEUR:TRIP:CHAUFFEUR-2026-8821:OTP-4821',
    baseFare: 299,
    extraHoursCharge: 240,
    nightCharge: 0,
    outstationDA: 0,
    platformFee: 49,
    gstTax: 29,
    discountAmount: 50,
    couponCode: 'FIRST50',
    totalFare: 567,
    paymentStatus: 'captured',
    paymentMethod: 'UPI (Google Pay)',
    specialInstructions: 'Car is parked near Tower 2 gate. Smooth driving appreciated.',
    createdAt: '2026-11-03T08:30:00Z',
    startedAt: '2026-11-03T14:35:00Z'
  },
  // Upcoming accepted outstation trip
  {
    id: 'demo_bk_02',
    bookingReference: 'CHAUFFEUR-2026-9044',
    customerId: 'demo_cust_01',
    customerName: 'Rohan Sharma (Demo)',
    customerPhone: '+91 98765 00001',
    driverId: 'demo_drv_blr_2',
    driverName: 'Venkatesh Murthy (Demo)',
    driverPhone: '+91 98111 00002',
    serviceType: 'outstation',
    serviceTitle: 'Outstation Highway Chauffeur (Bengaluru to Mysuru)',
    transmissionType: 'Automatic',
    vehicleType: 'Sedan',
    customerCar: 'Honda City ZX (Automatic) • KA-01-DM-1001',
    pickupAddress: 'Indiranagar, Bengaluru',
    pickupCity: 'Bengaluru',
    dropAddress: 'Lalitha Mahal Palace, Mysuru',
    startDate: '2026-11-05',
    startTime: '06:00',
    durationHours: 14,
    status: 'accepted',
    tripStartOtp: '7912',
    tripQrPayload: 'CHAUFFEUR:TRIP:CHAUFFEUR-2026-9044:OTP-7912',
    baseFare: 1599,
    extraHoursCharge: 300,
    nightCharge: 0,
    outstationDA: 350,
    platformFee: 49,
    gstTax: 115,
    discountAmount: 100,
    couponCode: 'WEEKEND100',
    totalFare: 2313,
    paymentStatus: 'authorized',
    paymentMethod: 'UPI (PhonePe)',
    specialInstructions: 'Family trip via Mysuru Expressway. Safe highway cruise speed (90 km/h).',
    createdAt: '2026-11-02T18:00:00Z'
  },
  // Airport Transfer Completed
  {
    id: 'demo_bk_03',
    bookingReference: 'CHAUFFEUR-2026-7210',
    customerId: 'demo_cust_02',
    customerName: 'Priya Sundaram (Demo)',
    customerPhone: '+91 98765 00002',
    driverId: 'demo_drv_blr_3',
    driverName: 'Shweta Manjunath (Demo)',
    driverPhone: '+91 98111 00003',
    serviceType: 'airport',
    serviceTitle: 'Airport Flight-Safe Drop (Kempegowda T2)',
    transmissionType: 'Automatic',
    vehicleType: 'Luxury',
    customerCar: 'BMW 3 Series Gran Limousine • KA-03-DM-2003',
    pickupAddress: 'Palm Meadows, Whitefield, Bengaluru',
    pickupCity: 'Bengaluru',
    dropAddress: 'Terminal 2, Kempegowda International Airport',
    startDate: '2026-10-31',
    startTime: '23:30',
    durationHours: 4,
    status: 'completed',
    tripStartOtp: '1109',
    tripQrPayload: 'CHAUFFEUR:TRIP:CHAUFFEUR-2026-7210:OTP-1109',
    baseFare: 699,
    extraHoursCharge: 0,
    nightCharge: 250,
    outstationDA: 0,
    platformFee: 49,
    gstTax: 50,
    discountAmount: 0,
    couponCode: null,
    totalFare: 1048,
    paymentStatus: 'captured',
    paymentMethod: 'Credit Card (Visa)',
    createdAt: '2026-10-31T19:00:00Z',
    startedAt: '2026-10-31T23:30:00Z',
    completedAt: '2026-11-01T03:15:00Z'
  },
  // Refunded Trip (For Refund Walkthrough in Admin)
  {
    id: 'demo_bk_04',
    bookingReference: 'CHAUFFEUR-2026-5541',
    customerId: 'demo_cust_04',
    customerName: 'Ananya Sen (Demo)',
    customerPhone: '+91 98765 00004',
    driverId: 'demo_drv_mum_1',
    driverName: 'Suresh Patil (Demo)',
    serviceType: 'hourly',
    serviceTitle: 'Hourly Rental Driver (2 Hours)',
    transmissionType: 'Automatic',
    vehicleType: 'SUV',
    customerCar: 'Kia Seltos • MH-02-DM-4005',
    pickupAddress: 'Pali Hill, Bandra West, Mumbai',
    pickupCity: 'Mumbai',
    dropAddress: 'BKC Corporate Plaza, Mumbai',
    startDate: '2026-10-28',
    startTime: '10:00',
    durationHours: 2,
    status: 'cancelled',
    tripStartOtp: '3341',
    totalFare: 413,
    paymentStatus: 'refunded',
    paymentMethod: 'UPI',
    cancellationReason: 'Customer meeting rescheduled by company',
    refundAmount: 413,
    refundedAt: '2026-10-28T10:15:00Z',
    createdAt: '2026-10-28T09:00:00Z'
  }
];

// 5. OPERATIONAL CITIES (10 Indian Metros)
export const DEMO_CITIES = [
  { id: 'city_blr', name: 'Bengaluru', state: 'Karnataka', active: true, baseRate: 159, activeDrivers: 310 },
  { id: 'city_delhi', name: 'Delhi NCR', state: 'Delhi & NCR', active: true, baseRate: 149, activeDrivers: 420 },
  { id: 'city_mumbai', name: 'Mumbai', state: 'Maharashtra', active: true, baseRate: 169, activeDrivers: 380 },
  { id: 'city_hyd', name: 'Hyderabad', state: 'Telangana', active: true, baseRate: 139, activeDrivers: 240 },
  { id: 'city_chn', name: 'Chennai', state: 'Tamil Nadu', active: true, baseRate: 149, activeDrivers: 190 },
  { id: 'city_pune', name: 'Pune', state: 'Maharashtra', active: true, baseRate: 139, activeDrivers: 175 },
  { id: 'city_kol', name: 'Kolkata', state: 'West Bengal', active: true, baseRate: 129, activeDrivers: 160 },
  { id: 'city_jpr', name: 'Jaipur', state: 'Rajasthan', active: true, baseRate: 129, activeDrivers: 120 },
  { id: 'city_chd', name: 'Chandigarh', state: 'Punjab & Haryana', active: true, baseRate: 139, activeDrivers: 95 },
  { id: 'city_lko', name: 'Lucknow', state: 'Uttar Pradesh', active: true, baseRate: 119, activeDrivers: 80 }
];

// 6. SAMPLE PROMO COUPONS
export const DEMO_COUPONS = [
  { id: 'cpn_1', code: 'FIRST50', discountType: 'flat', discountValue: 50, minBookingAmount: 299, description: 'Flat ₹50 OFF on your first personal chauffeur booking', isActive: true, expiresAt: '2026-12-31' },
  { id: 'cpn_2', code: 'WEEKEND100', discountType: 'flat', discountValue: 100, minBookingAmount: 999, description: 'Flat ₹100 OFF on full-day and weekend outstation road trips', isActive: true, expiresAt: '2026-12-31' },
  { id: 'cpn_3', code: 'WELCOME200', discountType: 'flat', discountValue: 200, minBookingAmount: 1499, description: 'Flat ₹200 OFF on monthly executive driver packages', isActive: true, expiresAt: '2026-12-31' },
  { id: 'cpn_4', code: 'DEMO10', discountType: 'percentage', discountValue: 10, maxDiscount: 150, minBookingAmount: 499, description: '10% OFF up to ₹150 for regular platform members', isActive: true, expiresAt: '2026-12-31' }
];

// 7. SAMPLE SUPPORT GRIEVANCES
export const DEMO_SUPPORT_TICKETS = [
  {
    id: 'tkt_demo_01',
    userId: 'demo_cust_01',
    userName: 'Rohan Sharma (Demo)',
    bookingReference: 'CHAUFFEUR-2026-7210',
    category: 'billing',
    subject: 'Request for Corporate GST Tax Invoice Copy',
    message: 'Please send the GST tax invoice mentioning company GSTIN 29AAAAA0000A1Z5 for airport drop.',
    status: 'resolved',
    resolutionNotes: 'GST invoice generated and emailed with input tax credit breakdown.',
    createdAt: '2026-11-01T08:00:00Z',
    resolvedAt: '2026-11-01T09:30:00Z'
  },
  {
    id: 'tkt_demo_02',
    userId: 'demo_cust_01',
    userName: 'Rohan Sharma (Demo)',
    bookingReference: 'CHAUFFEUR-2026-9044',
    category: 'outstation',
    subject: 'Inquiry regarding outstation driver stay and food allowance',
    message: 'Does the ₹350 DA cover driver food and hotel stay during our Mysuru weekend trip?',
    status: 'open',
    resolutionNotes: null,
    createdAt: '2026-11-02T20:00:00Z'
  }
];

// 8. SAMPLE REVIEWS
export const DEMO_REVIEWS = [
  {
    id: 'rev_demo_01',
    bookingId: 'demo_bk_03',
    driverId: 'demo_drv_blr_3',
    customerName: 'Priya Sundaram (Demo)',
    rating: 5.0,
    punctualityRating: 5.0,
    drivingSkillRating: 5.0,
    behaviorRating: 5.0,
    comment: 'Exceptional driving! Shweta arrived at 11:15 PM, 15 minutes before scheduled departure. Very smooth braking with our BMW 3 Series.',
    date: '2026-11-01'
  },
  {
    id: 'rev_demo_02',
    bookingId: 'demo_bk_past_01',
    driverId: 'demo_drv_blr_1',
    customerName: 'Rohan Sharma (Demo)',
    rating: 5.0,
    punctualityRating: 5.0,
    drivingSkillRating: 5.0,
    behaviorRating: 5.0,
    comment: 'Arjun drove our Honda City effortlessly in heavy Silk Board junction traffic. Highly punctual and professional uniform.',
    date: '2026-10-25'
  }
];

// 9. AUDIT LOGS
export const DEMO_AUDIT_LOGS = [
  {
    id: 'log_demo_01',
    adminName: 'Operations Admin (Console)',
    action: 'PLATFORM_SYSTEM_INIT',
    target: 'Marketplace Core Engine',
    details: 'Synthetic demonstration environment initialized across 10 Indian service zones.',
    timestamp: '2026-11-01T00:00:00Z'
  },
  {
    id: 'log_demo_02',
    adminName: 'Operations Admin (Console)',
    action: 'DRIVER_KYC_APPROVED',
    target: 'demo_drv_blr_1 (Arjun Gowda)',
    details: 'Commercial DL KA-01-2016-DEMO-01 and Police Clearance Certificate verified.',
    timestamp: '2026-11-01T09:00:00Z'
  }
];
