# Hand Cricket League (IPL Edition) 🏏

An interactive, responsive web game of **Hand Cricket** featuring all 10 IPL teams, 3D coin toss, simultaneous-move real-time PvP multiplayer via PeerJS (WebRTC), in-game chat & sledges, custom nicknames, and authentic stadium sound effects!

Hosted seamlessly on **Vercel** with **zero backend servers needed**.

---

## 🌟 Key Features

* **3 Game Modes**:
  * 🤖 **vs Bot (AI)**: Smart computer opponent that adjusts risk based on target equation.
  * 🌐 **Online PvP (Multiplayer)**: Play with anyone across the globe using a **Room Code** or a **1-Click Shareable Link** (`?room=HC-XXXX`). Zero server setup, powered by WebRTC!
  * 👥 **Pass & Play (Local 2P)**: Play on the same phone or laptop with secret turn inputs.
* **Match Formats**:
  * ♾️ **Classic**: Unlimited balls until a wicket is lost.
  * ⚡ **1 Over (Super Over)**: 6 balls high-stakes shootout.
  * ⏱️ **2 Overs & 5 Overs**: Limited overs strategy.
* **10 IPL Teams**:
  * CSK, MI, RCB, KKR, GT, LSG, RR, DC, SRH, PBKS with high-res logos, slogans, and team theme colors.
* **Custom Nicknames**:
  * Enter your custom cricket name; automatically saved in your browser and displayed on scoreboards, toss announcements, and chat.
* **Simultaneous Fair-Play Duel**:
  * Both players lock in their number (0 to 6) without seeing the other's pick. Both cards flip at the exact same millisecond!
* **Live In-Game Chat & Sledges**:
  * Real-time banter drawer plus one-tap floating reaction buttons (*"What a shot! 🔥"*, *"You're getting bowled! 🎯"*).
* **3D Animated Coin Toss**:
  * Heads or Tails flip with realistic rotation and coin sound effect.
* **Stadium Graphics & SFX**:
  * Authentic bat-hits, crowd roars on victory, stump rattling on wickets, screen-shake on OUT, and confetti celebrations.

---

## 🚀 How to Host on Vercel (Free & Instant)

### Option 1: Via GitHub & Vercel Dashboard (Recommended)
1. Initialize git in this folder or upload the files to a new GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "Initial Hand Cricket release"
   git remote add origin https://github.com/your-username/hand-cricket.git
   git push -u origin main
   ```
2. Go to [vercel.com](https://vercel.com) and log in.
3. Click **"Add New..."** $\rightarrow$ **"Project"**.
4. Select your `hand-cricket` GitHub repository.
5. In **Framework Preset**, select **Other** (it's a pure static web app).
6. Click **Deploy**. Your game will be live at `https://your-project.vercel.app` in under 30 seconds!

### Option 2: Drag and Drop (Vercel CLI or Deploy)
You can also deploy directly using the Vercel CLI by running `npx vercel` inside this folder.

---

## 💻 Playing Locally
To play right away on your computer:
* Simply double-click `index.html` to open it in Chrome, Edge, Safari, or Firefox!

---

## 📁 Project Structure
```text
hand-cricket/
├── assets/                  # All 30 custom logos, hand signs, banners & audio SFX
│   ├── csk.png, mi.png...   # 10 Team logos
│   ├── hand-0.png...        # 7 Hand gesture icons (0 to 6)
│   ├── coin-heads.png...    # Coin toss faces
│   ├── out-wicket.png...    # Match celebration banners
│   ├── bat-hit.mp3...       # Sound effects
│   └── stadium-bg.jpg       # Stadium backdrop
├── css/
│   └── styles.css           # 3D coin toss, animations, shake effects & custom layout
├── js/
│   ├── teams.js             # 10 IPL team metadata, colors, logos
│   ├── audio.js             # Sound effects manager & mute persistence
│   ├── game-engine.js       # Core cricket logic (innings, overs, strike rates, bot AI)
│   ├── peer-service.js      # PeerJS WebRTC networking & simultaneous move locking
│   └── app.js               # UI controller, event bindings, screen routing
├── index.html               # Main single-page web app
├── vercel.json              # Vercel deployment cache & routing configuration
└── README.md                # Documentation & instructions
```
