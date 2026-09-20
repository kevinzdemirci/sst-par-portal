# School of Science and Technology (SST) — Personnel Action Request (PAR) Portal

An enterprise-grade, charter-district-compliant Personnel Action Request (PAR) workflow management and tracking system built for Texas charter district **School of Science and Technology (SST)**.

---

## 🚀 Key Features

1. **Official SST PAR Form View & Print Mode**:
   - Matches the official School of Science and Technology Personnel Action Request form layout.
   - Texas e-signature compliance (Texas Uniform Electronic Transactions Act, Tex. Bus. & Com. Code § 322).
   - Employee identification, contract adjustments, salary compensation, and separation tracking.
   - Built-in PDF/Paper Print styling (`window.print()`).

2. **5-Stage Sequential Approval Workflow**:
   - **Step 1**: Campus Principal / Department Supervisor Endorsement
   - **Step 2**: Chief People Officer (Dr. Kevin Demirci) for involuntary terminations & executive actions OR Regional Executive Director (Atnan Ekin for Houston, Serdar Bulut for San Antonio & Corpus Christi) for voluntary resignations
   - **Step 3**: Regional HR Coordinator (Kristy Stewart for Houston; Amber Johnson for San Antonio & Corpus Christi)
   - **Step 4**: Benefits & COBRA Separation Review (Ursula Villanueva)
   - **Step 5**: Payroll Wage Settlement & ADP Closeout (Paola Comparini)

3. **1-Click Interactive Test Switcher**:
   - Directly inside any request modal, an action banner shows which approver is needed next.
   - Click `"⚡ Switch to [Name] to Sign"` to instantly simulate that persona and advance the request through all 5 approval stages.

4. **SST Routing Rules Engine & Live Simulator**:
   - Admin tool to customize, reorder, and toggle routing rules.
   - Conditional evaluation based on Action Type, Campus Region (Houston vs. SA & CC vs. Austin vs. Central), and Termination Classification (Involuntary vs. Voluntary).
   - Real-time simulator visualizes the generated approval chain instantly.

5. **Role Management & Account Activation**:
   - **Role Removal**: Prominent removal button on all roles, with automatic safeguard fallback for routing rules.
   - **Account Activation**: Approvers claim their workflow role, configure their digital signature (cursive handwriting or live HTML5 canvas pad), and set up a 4-6 digit signing PIN.
   - **Role Directory Manager**: Dedicated modal to manage, search, simulate, activate, deactivate, or delete any role.

---

## 🛠️ Technology Stack

- **Framework**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Celebration Effects**: Canvas-Confetti

---

## 📦 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation
```bash
# Clone the repository
git clone https://github.com/<YOUR_USERNAME>/sst-par-tracker.git

# Navigate to project directory
cd sst-par-tracker

# Install dependencies
npm install

# Start development server
npm run dev
```

### Production Build
```bash
npm run build
npm run preview
```

---

## 🏛️ SST District Approver Directory

| Name | Role | Email | Region / Scope |
| :--- | :--- | :--- | :--- |
| **Vanessa Nguyen** | Principal / Initiator | `vnguyen@ssttx.org` | SST Champions Elementary |
| **Dr. Kevin Demirci** | Chief People Officer | `kdemirci@ssttx.org` | All SST Schools (Involuntary / Executive) |
| **Atnan Ekin** | Regional Executive Director | `aekin@ssttx.org` | Houston Area Campuses |
| **Serdar Bulut** | Regional Executive Director | `sbulut@ssttx.org` | San Antonio & Corpus Christi Campuses |
| **Kristy Stewart** | Regional HR Coordinator | `kstewart@ssttx.org` | Houston Area Campuses |
| **Amber Johnson** | Regional HR Coordinator | `ajohnson@ssttx.org` | San Antonio & Corpus Christi Campuses |
| **Ursula Villanueva** | Benefits & COBRA Coordinator | `uvillanueva@ssttx.org` | Central Office / All SST Schools |
| **Paola Comparini** | Payroll Coordinator | `pcomparini@ssttx.org` | Central Office / All SST Schools |
