require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const mongoose = require("mongoose");
const Asset = require("../model/Asset");
const ActivityLog = require("../model/ActivityLog");

const assets = [
  // Dell (12)
  {
    serialNumber: "379MTH3",
    currentName: "CAST-CASBURN",
    manufacturer: "Dell",
    model: "OptiPlex 7090",
    description: "Computer",
    status: "Active",
    purchaseDate: "2021-03-15",
    notes: "Primary faculty workstation",
    renameHistory: [
      { renamedFrom: "CAST-DEVRAJNA1", renamedTo: "CAST-KASHIFFI", date: "2023-02-20" },
      { renamedFrom: "CAST-KASHIFFI", renamedTo: "CAST-FUEGO", date: "2024-07-16" },
      { renamedFrom: "CAST-FUEGO", renamedTo: "CAST-CASBURN", date: "2024-07-17" },
    ],
  },
  {
    serialNumber: "12JZRY3",
    currentName: "CAST-OPS-01",
    manufacturer: "Dell",
    model: "OptiPlex 7060",
    description: "Computer",
    status: "Active",
    purchaseDate: "2020-01-11",
    notes: "",
    renameHistory: [],
  },
  {
    serialNumber: "11R9PY2",
    currentName: "CAST-OPS-02",
    manufacturer: "Dell",
    model: "OptiPlex 7060",
    description: "Computer",
    status: "Active",
    purchaseDate: "2019-05-22",
    notes: "Has broken USB port",
    renameHistory: [],
  },
  {
    serialNumber: "9QW7MZ1",
    currentName: "CAST-LAB-17",
    manufacturer: "Dell",
    model: "OptiPlex 7010",
    description: "Computer",
    status: "Disposed",
    purchaseDate: "2018-09-03",
    notes: "",
    renameHistory: [],
  },
  {
    serialNumber: "8AT3LK9",
    currentName: "CAST-LAB-08",
    manufacturer: "Dell",
    model: "OptiPlex 7010",
    description: "Computer",
    status: "Disposed",
    purchaseDate: "2018-11-14",
    notes: "",
    renameHistory: [],
  },
  {
    serialNumber: "DL7450A1",
    currentName: "CAST-FRONTDESK-01",
    manufacturer: "Dell",
    model: "OptiPlex 7450 AIO",
    description: "Computer",
    status: "Ready to Deploy",
    purchaseDate: "2022-06-01",
    notes: "Reserved for new hire",
    renameHistory: [],
  },
  {
    serialNumber: "DL7090B2",
    currentName: "CAST-NOC-03",
    manufacturer: "Dell",
    model: "OptiPlex 7090",
    description: "Computer",
    status: "In Repair",
    purchaseDate: "2021-10-09",
    notes: "Fan replacement pending",
    renameHistory: [],
  },
  {
    serialNumber: "DL7090C3",
    currentName: "CAST-NOC-04",
    manufacturer: "Dell",
    model: "OptiPlex 7090",
    description: "Computer",
    status: "Active",
    purchaseDate: "2023-02-13",
    notes: "",
    renameHistory: [],
  },
  {
    serialNumber: "DL7060D4",
    currentName: "CAST-LIB-02",
    manufacturer: "Dell",
    model: "OptiPlex 7060",
    description: "Computer",
    status: "Active",
    purchaseDate: "2020-12-03",
    notes: "",
    renameHistory: [],
  },
  {
    serialNumber: "DL7060E5",
    currentName: "CAST-LIB-03",
    manufacturer: "Dell",
    model: "OptiPlex 7060",
    description: "Computer",
    status: "Active",
    purchaseDate: "2021-08-19",
    notes: "",
    renameHistory: [],
  },
  {
    serialNumber: "DL7010F6",
    currentName: "CAST-ARCHIVE-01",
    manufacturer: "Dell",
    model: "OptiPlex 7010",
    description: "Computer",
    status: "Disposed",
    purchaseDate: "2018-04-27",
    notes: "",
    renameHistory: [],
  },
  {
    serialNumber: "DL7450G7",
    currentName: "CAST-AIO-01",
    manufacturer: "Dell",
    model: "OptiPlex 7450 AIO",
    description: "Monitor",
    status: "Active",
    purchaseDate: "2022-01-18",
    notes: "",
    renameHistory: [],
  },

  // HP (4)
  {
    serialNumber: "HP840X12",
    currentName: "CAST-MOBILE-07",
    manufacturer: "HP",
    model: "EliteBook 840",
    description: "Laptop",
    status: "Active",
    purchaseDate: "2024-02-14",
    notes: "Loaner pool laptop",
    renameHistory: [
      { renamedFrom: "HP-TEMP", renamedTo: "CAST-MOB-POOL", date: "2024-02-20" },
      { renamedFrom: "CAST-MOB-POOL", renamedTo: "CAST-MOBILE-07", date: "2024-08-01" },
    ],
  },
  {
    serialNumber: "HP840Y77",
    currentName: "CAST-FACULTY-14",
    manufacturer: "HP",
    model: "EliteBook 840",
    description: "Laptop",
    status: "Ready to Deploy",
    purchaseDate: "2022-09-09",
    notes: "",
    renameHistory: [],
  },
  {
    serialNumber: "HP840Z01",
    currentName: "CAST-TECH-03",
    manufacturer: "HP",
    model: "EliteBook 840",
    description: "Laptop",
    status: "In Repair",
    purchaseDate: "2023-04-18",
    notes: "Battery health below threshold",
    renameHistory: [
      { renamedFrom: "CAST-T1", renamedTo: "CAST-T2", date: "2023-05-01" },
      { renamedFrom: "CAST-T2", renamedTo: "CAST-T3", date: "2023-06-01" },
      { renamedFrom: "CAST-T3", renamedTo: "CAST-TECH-03", date: "2024-01-10" },
    ],
  },
  {
    serialNumber: "HP840K22",
    currentName: "CAST-VISITOR-02",
    manufacturer: "HP",
    model: "EliteBook 840",
    description: "Laptop",
    status: "Ready to Deploy",
    purchaseDate: "2023-12-05",
    notes: "Reserved for orientation week",
    renameHistory: [],
  },

  // Microsoft (3)
  {
    serialNumber: "MSP7A111",
    currentName: "CAST-SURFACE-01",
    manufacturer: "Microsoft",
    model: "Surface Pro 7",
    description: "Computer",
    status: "Active",
    purchaseDate: "2021-11-21",
    notes: "",
    renameHistory: [],
  },
  {
    serialNumber: "MSP7B222",
    currentName: "CAST-SURFACE-02",
    manufacturer: "Microsoft",
    model: "Surface Pro 7",
    description: "Computer",
    status: "Redeploy",
    purchaseDate: "2020-03-17",
    notes: "",
    renameHistory: [
      { renamedFrom: "CAST-TAB-02", renamedTo: "CAST-MOB-12", date: "2021-01-08" },
      { renamedFrom: "CAST-MOB-12", renamedTo: "CAST-SURFACE-02", date: "2022-07-19" },
    ],
  },
  {
    serialNumber: "MSP7C333",
    currentName: "CAST-SURFACE-03",
    manufacturer: "Microsoft",
    model: "Surface Pro 7",
    description: "Monitor",
    status: "Disposed",
    purchaseDate: "2019-02-12",
    notes: "Touch panel ghost input",
    renameHistory: [],
  },

  // Apple (1)
  {
    serialNumber: "C02ZK0IMAC",
    currentName: "CAST-MEDIA-IMAC",
    manufacturer: "Apple",
    model: "iMac",
    description: "Computer",
    status: "Active",
    purchaseDate: "2022-04-08",
    notes: "Video editing station",
    renameHistory: [
      { renamedFrom: "CAST-MEDIA-OLD", renamedTo: "CAST-MEDIA-IMAC", date: "2023-03-15" },
    ],
  },
];

function makeActivityLogs() {
  const logs = [];
  const now = new Date();

  // Added events for all 20 assets
  assets.forEach((asset, index) => {
    logs.push({
      serialNumber: asset.serialNumber,
      machineName: asset.currentName,
      action: "Added",
      details: "New asset added",
      date: new Date(now.getTime() - (index + 30) * 86400000),
    });
  });

  // Rename events for assets with rename histories (5 assets)
  const withRenames = assets.filter((a) => a.renameHistory.length > 0);
  withRenames.forEach((asset, idx) => {
    const last = asset.renameHistory[asset.renameHistory.length - 1];
    logs.push({
      serialNumber: asset.serialNumber,
      machineName: asset.currentName,
      action: "Renamed",
      details: `${last.renamedFrom} → ${last.renamedTo}`,
      date: new Date(now.getTime() - (idx + 7) * 86400000),
    });
  });

  // 5 status changes to reach exactly 30 logs
  const statusEvents = [
    ["9QW7MZ1", "CAST-LAB-17", "Active → Disposed"],
    ["8AT3LK9", "CAST-LAB-08", "Active → Disposed"],
    ["HP840Z01", "CAST-TECH-03", "Active → In Repair"],
    ["MSP7B222", "CAST-SURFACE-02", "Active → Redeploy"],
    ["HP840Y77", "CAST-FACULTY-14", "Active → Ready to Deploy"],
  ];

  statusEvents.forEach((event, i) => {
    logs.push({
      serialNumber: event[0],
      machineName: event[1],
      action: "Status Changed",
      details: event[2],
      date: new Date(now.getTime() - (i + 2) * 86400000),
    });
  });

  return logs;
}

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    await Asset.deleteMany({});
    await ActivityLog.deleteMany({});

    await Asset.insertMany(assets);
    const logs = makeActivityLogs();
    await ActivityLog.insertMany(logs);

    console.log("Seeded 20 assets and 30 activity log entries");
    process.exit(0);
  } catch (error) {
    console.error("Seed failed:", error.message);
    process.exit(1);
  }
}

run();
