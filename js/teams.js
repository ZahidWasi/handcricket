// Team definitions, branding, and color palettes
const TEAMS = [
  {
    id: "csk",
    name: "Chennai Super Kings",
    shortName: "CSK",
    primaryColor: "#FDB913",
    secondaryColor: "#005BAA",
    textColor: "#111827",
    accentGlow: "rgba(253, 185, 19, 0.4)",
    logo: "assets/csk.png",
    slogan: "Whistle Podu! 🦁"
  },
  {
    id: "mi",
    name: "Mumbai Indians",
    shortName: "MI",
    primaryColor: "#004BA0",
    secondaryColor: "#D1AB3E",
    textColor: "#FFFFFF",
    accentGlow: "rgba(0, 75, 160, 0.4)",
    logo: "assets/mi.png",
    slogan: "Duniya Hila Denge! 💙"
  },
  {
    id: "rcb",
    name: "Royal Challengers Bengaluru",
    shortName: "RCB",
    primaryColor: "#EC1C24",
    secondaryColor: "#000000",
    textColor: "#FFFFFF",
    accentGlow: "rgba(236, 28, 36, 0.4)",
    logo: "assets/rcb.png",
    slogan: "Ee Sala Cup Namde! ❤️"
  },
  {
    id: "kkr",
    name: "Kolkata Knight Riders",
    shortName: "KKR",
    primaryColor: "#3A225D",
    secondaryColor: "#D1AB3E",
    textColor: "#FFFFFF",
    accentGlow: "rgba(58, 34, 93, 0.4)",
    logo: "assets/kkr.png",
    slogan: "Korbo Lorbo Jeetbo! 💜"
  },
  {
    id: "gt",
    name: "Gujarat Titans",
    shortName: "GT",
    primaryColor: "#1B2133",
    secondaryColor: "#D1AB3E",
    textColor: "#FFFFFF",
    accentGlow: "rgba(27, 33, 51, 0.4)",
    logo: "assets/gt.png",
    slogan: "Aava De! ⚡"
  },
  {
    id: "lsg",
    name: "Lucknow Super Giants",
    shortName: "LSG",
    primaryColor: "#3366FF",
    secondaryColor: "#FF5E00",
    textColor: "#FFFFFF",
    accentGlow: "rgba(51, 102, 255, 0.4)",
    logo: "assets/lsg.png",
    slogan: "Ab Apni Baari Hai! 🦅"
  },
  {
    id: "rr",
    name: "Rajasthan Royals",
    shortName: "RR",
    primaryColor: "#EA1A85",
    secondaryColor: "#004BA0",
    textColor: "#FFFFFF",
    accentGlow: "rgba(234, 26, 133, 0.4)",
    logo: "assets/rr.png",
    slogan: "Halla Bol! 👑"
  },
  {
    id: "dc",
    name: "Delhi Capitals",
    shortName: "DC",
    primaryColor: "#004C93",
    secondaryColor: "#EA1B23",
    textColor: "#FFFFFF",
    accentGlow: "rgba(0, 76, 147, 0.4)",
    logo: "assets/dc.png",
    slogan: "Roar Macha! 🐯"
  },
  {
    id: "srh",
    name: "Sunrisers Hyderabad",
    shortName: "SRH",
    primaryColor: "#FF5500",
    secondaryColor: "#000000",
    textColor: "#FFFFFF",
    accentGlow: "rgba(255, 85, 0, 0.4)",
    logo: "assets/srh.png",
    slogan: "Orange Army! 🦅"
  },
  {
    id: "pbks",
    name: "Punjab Kings",
    shortName: "PBKS",
    primaryColor: "#ED1B24",
    secondaryColor: "#D1AB3E",
    textColor: "#FFFFFF",
    accentGlow: "rgba(237, 27, 36, 0.4)",
    logo: "assets/pbks.png",
    slogan: "Sadda Punjab! 🦁"
  }
];

function getTeamById(id) {
  return TEAMS.find(t => t.id === id) || TEAMS[0];
}
