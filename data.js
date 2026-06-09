// Seed data for HostelHub (Global Scope)
const DEFAULT_MENU = {
  Monday: {
    Breakfast: { time: "08:00 AM - 09:30 AM", items: ["Aloo Paratha", "Curd", "Butter", "Tea"] },
    Lunch: { time: "12:30 PM - 02:00 PM", items: ["Dal Tadka", "Mix Veg", "Jeera Rice", "Roti", "Buttermilk"] },
    Snacks: { time: "05:00 PM - 06:00 PM", items: ["Samosa", "Mint Chutney", "Tea"] },
    Dinner: { time: "08:00 PM - 09:30 PM", items: ["Kadhai Paneer", "Aloo Gobhi", "Plain Rice", "Roti", "Kheer"] }
  },
  Tuesday: {
    Breakfast: { time: "08:00 AM - 09:30 AM", items: ["Poha", "Sev", "Jalebi", "Milk", "Tea"] },
    Lunch: { time: "12:30 PM - 02:00 PM", items: ["Rajma Masala", "Aloo Bhindi", "Steamed Rice", "Tandoori Roti", "Salad"] },
    Snacks: { time: "05:00 PM - 06:00 PM", items: ["Bread Pakoda", "Ketchup", "Coffee"] },
    Dinner: { time: "08:00 PM - 09:30 PM", items: ["Egg Curry", "Malai Kofta (Veg)", "Jeera Rice", "Roti", "Gulab Jamun"] }
  },
  Wednesday: {
    Breakfast: { time: "08:00 AM - 09:30 AM", items: ["Idli", "Vada", "Sambar", "Coconut Chutney", "Tea"] },
    Lunch: { time: "12:30 PM - 02:00 PM", items: ["Chole", "Bhature", "Pulao", "Boondi Raita", "Pickle"] },
    Snacks: { time: "05:00 PM - 06:00 PM", items: ["Pav Bhaji", "Lemon", "Tea"] },
    Dinner: { time: "08:00 PM - 09:30 PM", items: ["Paneer Bhurji", "Dal Makhani", "Steamed Rice", "Roti", "Ice Cream"] }
  },
  Thursday: {
    Breakfast: { time: "08:00 AM - 09:30 AM", items: ["Methi Thepla", "Pickle", "Curd", "Tea"] },
    Lunch: { time: "12:30 PM - 02:00 PM", items: ["Kadhi Pakoda", "Aloo Jeera", "Steamed Rice", "Roti", "Papad"] },
    Snacks: { time: "05:00 PM - 06:00 PM", items: ["Aloo Tikki Chaat", "Tea"] },
    Dinner: { time: "08:00 PM - 09:30 PM", items: ["Veg Biryani", "Mirchi Ka Salan", "Raita", "Roti", "Custard"] }
  },
  Friday: {
    Breakfast: { time: "08:00 AM - 09:30 AM", items: ["Bread Omlette", "Veg Sandwich", "Banana", "Milk", "Tea"] },
    Lunch: { time: "12:30 PM - 02:00 PM", items: ["Lauki Kofta", "Masoor Dal", "Steamed Rice", "Roti", "Curd"] },
    Snacks: { time: "05:00 PM - 06:00 PM", items: ["Veg Momos", "Spicy Garlic Sauce", "Soup"] },
    Dinner: { time: "08:00 PM - 09:30 PM", items: ["Butter Chicken", "Shahi Paneer (Veg)", "Pulao", "Butter Naan", "Halwa"] }
  },
  Saturday: {
    Breakfast: { time: "08:00 AM - 09:30 AM", items: ["Puri", "Aloo Masala Sabji", "Halwa", "Tea"] },
    Lunch: { time: "12:30 PM - 02:00 PM", items: ["Veg Jalfrezi", "Dal Moong", "Steamed Rice", "Roti", "Salad"] },
    Snacks: { time: "05:00 PM - 06:00 PM", items: ["French Fries", "Ketchup", "Tea"] },
    Dinner: { time: "08:00 PM - 09:30 PM", items: ["Aloo Paratha", "Butter", "Green Chutney", "Milk"] }
  },
  Sunday: {
    Breakfast: { time: "08:00 AM - 09:30 AM", items: ["Uttapam", "Sambar", "Tomato Chutney", "Tea"] },
    Lunch: { time: "12:30 PM - 02:00 PM", items: ["Veg Pulao", "Dal Fry", "Aloo Shimla Mirch", "Roti", "Ice Cream"] },
    Snacks: { time: "05:00 PM - 06:00 PM", items: ["Samosa Chaat", "Tea"] },
    Dinner: { time: "08:00 PM - 09:30 PM", items: ["Mutter Paneer", "Yellow Dal", "Steamed Rice", "Roti", "Rasgulla"] }
  }
};

const MOCK_COMPLAINTS = [
  {
    id: "comp_1",
    studentName: "Aarav Sharma",
    roomNo: "B-204",
    category: "Room",
    title: "Ceiling Fan Making Loud Noise",
    description: "The ceiling fan in my room is shaking and making a very loud clicking sound at speed 3 and above. It makes it impossible to sleep.",
    urgency: "Medium",
    status: "Pending",
    date: "2026-06-08T10:30:00Z",
    resolutionNote: ""
  },
  {
    id: "comp_2",
    studentName: "Sneha Patel",
    roomNo: "G-102",
    category: "Electricity",
    title: "Frequent Power Cuts in Wing G",
    description: "The main trip switch for G-Wing tripped three times yesterday. Currently there is no power in socket outlets of room 102 and 103.",
    urgency: "Critical",
    status: "In Progress",
    date: "2026-06-09T08:15:00Z",
    resolutionNote: "Electrician has been called. Checking the main distribution board in the corridor."
  },
  {
    id: "comp_3",
    studentName: "Rohan Verma",
    roomNo: "A-312",
    category: "Food",
    title: "Undercooked Chapatis in Dinner",
    description: "The chapatis served during dinner on Monday night were completely raw in the middle. Please instruct the kitchen staff to cook them properly.",
    urgency: "Medium",
    status: "Resolved",
    date: "2026-06-07T21:45:00Z",
    resolutionNote: "Spoke to the head mess contractor. The heating temperature of the tandoor has been adjusted and raw chapati checks are now mandatory."
  },
  {
    id: "comp_4",
    studentName: "Ishan Kishan",
    roomNo: "C-110",
    category: "Wi-Fi",
    title: "Extremely Low Speed on Hostel Wi-Fi",
    description: "The Wi-Fi speed in room C-110 is less than 500kbps, making it impossible to attend online lectures or work on projects.",
    urgency: "Low",
    status: "Pending",
    date: "2026-06-09T14:20:00Z",
    resolutionNote: ""
  }
];

const MOCK_POLLS = [
  {
    id: "poll_1",
    creatorName: "Kabir Mehta",
    roomNo: "B-309",
    appName: "Blinkit",
    targetTime: "07:30 PM",
    meetingSpot: "Hostel Gate A",
    description: "Ordering some snacks, soft drinks, and ice cream. Need someone to pool so we can hit the free delivery mark!",
    members: [
      { name: "Kabir Mehta", room: "B-309", items: "1x Coke Zero, 2x Lay's Magic Masala" },
      { name: "Rohan Gupta", room: "B-312", items: "1x Amul Vanilla Ice Cream (1L)" }
    ],
    status: "Active"
  },
  {
    id: "poll_2",
    creatorName: "Diya Iyer",
    roomNo: "G-205",
    appName: "Zomato",
    targetTime: "08:15 PM",
    meetingSpot: "G-Wing Reception Lobby",
    description: "Craving Biryani from 'Biryani By Kilo'. Let's group order to save on high surge delivery fees!",
    members: [
      { name: "Diya Iyer", room: "G-205", items: "1x Hyderabadi Chicken Biryani (Single)" }
    ],
    status: "Active"
  },
  {
    id: "poll_3",
    creatorName: "Aryan Sen",
    roomNo: "A-104",
    appName: "Zepto",
    targetTime: "06:00 PM",
    meetingSpot: "Hostel Main Gate",
    description: "Ordering daily essentials (shampoo, soap, biscuits). Placed successfully.",
    members: [
      { name: "Aryan Sen", room: "A-104", items: "1x Nivea Shower Gel" },
      { name: "Yash Sinha", room: "A-105", items: "2x Hide & Seek Biscuit" }
    ],
    status: "Closed"
  }
];

const APP_DETAILS = {
  Blinkit: { color: "#FFF200", textColor: "#000000", logoText: "blinkit" },
  Zomato: { color: "#CB202D", textColor: "#FFFFFF", logoText: "zomato" },
  Swiggy: { color: "#FC8019", textColor: "#FFFFFF", logoText: "swiggy" },
  Zepto: { color: "#5F259F", textColor: "#FFFFFF", logoText: "zepto" },
  Instamart: { color: "#E03546", textColor: "#FFFFFF", logoText: "instamart" },
  Other: { color: "#4A5568", textColor: "#FFFFFF", logoText: "delivery" }
};

// Bind to window object to ensure clean global namespacing
window.DEFAULT_MENU = DEFAULT_MENU;
window.MOCK_COMPLAINTS = MOCK_COMPLAINTS;
window.MOCK_POLLS = MOCK_POLLS;
window.APP_DETAILS = APP_DETAILS;
