export const SEED_TRANSACTIONS = [
  { id: "1",  date: "2025-05-30", account: "Salary",             category: "Income",         label: "💸", notes: "May payroll",           amount:  45000  },
  { id: "2",  date: "2025-05-29", account: "Grab Food",          category: "Food & Drink",   label: "",   notes: "Lunch",                 amount:   -320  },
  { id: "3",  date: "2025-05-28", account: "Meralco",            category: "Housing",        label: "🏡", notes: "Electric bill",         amount:  -2850  },
  { id: "4",  date: "2025-05-27", account: "BDO Transfer",       category: "Transfer",       label: "",   notes: "Emergency fund",        amount:  -8000  },
  { id: "5",  date: "2025-05-26", account: "Shopee",             category: "Fun",            label: "",   notes: "Keyboard",              amount:  -1499  },
  { id: "6",  date: "2025-05-25", account: "Jollibee",           category: "Food & Drink",   label: "",   notes: "",                      amount:   -215  },
  { id: "7",  date: "2025-05-24", account: "Netflix",            category: "Fun",            label: "",   notes: "Monthly subscription",  amount:   -499  },
  { id: "8",  date: "2025-05-23", account: "Water Bill",         category: "Housing",        label: "🏡", notes: "Maynilad",              amount:   -850  },
  { id: "9",  date: "2025-05-22", account: "Freelance Payment",  category: "Income",         label: "💸", notes: "UI design project",     amount:  12000  },
  { id: "10", date: "2025-05-21", account: "Pharmacy",           category: "Medical",        label: "❤️", notes: "Vitamins & meds",       amount:   -620  },
  { id: "11", date: "2025-05-20", account: "Coffee Bean",        category: "Food & Drink",   label: "",   notes: "",                      amount:   -180  },
  { id: "12", date: "2025-05-19", account: "PLDT",               category: "Housing",        label: "🏡", notes: "Internet bill",         amount:  -1699  },
  { id: "13", date: "2025-05-18", account: "GrabCar",            category: "Transportation", label: "",   notes: "Airport drop-off",      amount:   -450  },
  { id: "14", date: "2025-05-17", account: "Dampa Restaurant",   category: "Food & Drink",   label: "",   notes: "Dinner with friends",   amount:  -1250  },
  { id: "15", date: "2025-05-16", account: "Stock Dividend",     category: "Income",         label: "💸", notes: "ACEN dividend",         amount:    800  },
  { id: "16", date: "2025-05-15", account: "Lazada",             category: "Fun",            label: "",   notes: "Headphones",            amount:  -2300  },
  { id: "17", date: "2025-05-14", account: "Petco",              category: "Pet Essentials", label: "🐶", notes: "Dog food & treats",     amount:   -890  },
  { id: "18", date: "2025-05-13", account: "SM Supermarket",     category: "Food & Drink",   label: "",   notes: "Weekly groceries",      amount:  -2100  },
  { id: "19", date: "2025-05-12", account: "Grab Food",          category: "Food & Drink",   label: "",   notes: "Dinner delivery",       amount:   -480  },
  { id: "20", date: "2025-05-11", account: "Allowance",          category: "Allowance",      label: "💸", notes: "From parents",          amount:   3000  },
  { id: "21", date: "2025-05-10", account: "Spotify",            category: "Fun",            label: "",   notes: "Monthly subscription",  amount:   -169  },
  { id: "22", date: "2025-05-09", account: "Mercury Drug",       category: "Medical",        label: "❤️", notes: "Prescription refill",   amount:   -340  },
  { id: "23", date: "2025-05-08", account: "Angkas",             category: "Transportation", label: "",   notes: "Commute",               amount:    -89  },
  { id: "24", date: "2025-05-07", account: "Vet Clinic",         category: "Pet Essentials", label: "🐶", notes: "Annual check-up",       amount:  -1500  },
  { id: "25", date: "2025-05-06", account: "Youtube Premium",    category: "Fun",            label: "",   notes: "Family plan",           amount:   -219  },
  { id: "26", date: "2025-05-05", account: "GCash Transfer",     category: "Transfer",       label: "",   notes: "Send to sibling",       amount:  -1000  },
  { id: "27", date: "2025-05-04", account: "Freelance Payment",  category: "Income",         label: "💸", notes: "Logo design",           amount:   5500  },
  { id: "28", date: "2025-05-03", account: "Puregold",           category: "Food & Drink",   label: "",   notes: "Monthly groceries",     amount:  -3800  },
  { id: "29", date: "2025-05-02", account: "Globe",              category: "Housing",        label: "🏡", notes: "Postpaid bill",         amount:  -1299  },
  { id: "30", date: "2025-05-01", account: "Salary",             category: "Income",         label: "💸", notes: "April payroll",         amount:  45000  },
];

// ─── Constants ────────────────────────────────────────────────────────────────

export const CATEGORIES = [
  "Food & Drink",
  "Housing",
  "Transportation",
  "Fun",
  "Medical",
  "Pet Essentials",
  "Income",
  "Allowance",
  "Transfer",
  "Other",
] as const;

export const LABELS = ["💸", "❤️", "🏡", "🔥", "🐶"] as const;