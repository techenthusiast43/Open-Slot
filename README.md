# OpenSlot ⏱️

**Decentralized, Gas-Optimized Appointment-Booking Platform on BOT Chain**

OpenSlot is a production-grade Web3 dApp engineered for service providers, consultants, healthcare practitioners, and clients. Businesses publish open appointment slots directly on BOT Chain, and customers reserve appointments securely using their connected Web3 wallets—with zero double-booking, pure trustless state, and zero tokens, payments, or escrow dependencies.

---

## 🌐 Official BOT Chain Testnet Configuration

OpenSlot is configured for the **BOT Chain Testnet** (Bohr infrastructure):

| Parameter | Value |
| :--- | :--- |
| **Network Name** | BOT Chain Testnet |
| **Chain ID (Decimal)** | `968` |
| **Chain ID (Hex)** | `0x3c8` |
| **RPC Endpoint** | `https://rpc.bohr.life` |
| **Native Token Symbol** | `BOT` (or `tBOT`) |
| **Token Decimals** | `18` |
| **Total Supply** | `150 Million` |
| **Block Explorer** | [https://scan.bohr.life](https://scan.bohr.life) |
| **Testnet Faucet** | [https://faucet.botchain.ai](https://faucet.botchain.ai) |
| **Multicall3 Address** | `0x47FA21f684bBAD707A53a0f9BE59F1422F46C265` |

---

## ⚡ Smart Contract: `OpenSlot.sol`

Located at [`contracts/OpenSlot.sol`](./contracts/OpenSlot.sol).

### Ultra-Gas-Optimized Storage Packing
Each appointment slot occupies **exactly two 32-byte storage slots**:

```
Storage Slot 0 (21 bytes packed):
[address business (20 bytes)] [SlotStatus status (1 byte)]

Storage Slot 1 (30 bytes packed):
[address customer (20 bytes)] [uint48 startTime (6 bytes)] [uint32 duration (4 bytes)]
```

* `uint48 startTime`: Compact Unix timestamp in seconds (valid past the year 8,900,000).
* `uint32 duration`: Slot duration in seconds (e.g. 1800 for 30m, 3600 for 1h).
* Packing eliminates 50% of `SSTORE` operations, drastically saving gas on BOT Chain.

### Contract Features
1. **Business Registration (`registerBusiness`)**: Wallets register as providers with off-chain metadata (name, bio, logo, contact).
2. **Single Slot Creation (`createSlot`)**: Providers publish slots with future unix timestamp and duration.
3. **Batch Slot Creation (`createBatchSlots`)**: Providers publish up to 50 slots in a single transaction.
4. **Anti-Double-Booking (`bookSlot`)**: Reverts if status is not `Available` or if slot start time is in the past.
5. **Customer Cancellation (`cancelBooking`)**: Customers can cancel their bookings prior to the appointment.
6. **Business Confirmation (`confirmBooking`)**: Providers can confirm booked appointments.
7. **Unbooked Cancellation (`cancelSlot`)**: Providers can cancel unbooked slots.
8. **Batch Reading (`getSlotsBatch`)**: High-performance batch getter for querying multiple slots in one RPC call.

---

## 💻 Frontend Architecture

Built with **React 19**, **Vite**, **Tailwind CSS**, and **Ethers.js v6**:

1. **Landing Page (`/`)**: Value proposition, network stats, explorer links, and provider/customer onboarding.
2. **Business Registration (`/register`)**: Wallet registration form capturing business name, category, description, and avatar with off-chain metadata persistence.
3. **Business Dashboard (`/dashboard`)**: Metric cards, slot filters (Pending, Confirmed, Available, Cancelled), confirmation controls, and unbooked slot cancellation.
4. **Create Slot Page (`/create-slot`)**: Interactive date picker, duration selector (15m, 30m, 45m, 1h, 2h), single slot creator, and batch recurring slot generator.
5. **Browse Businesses (`/businesses`)**: Searchable directory of registered businesses with category filtering and profile cards.
6. **Available Slots Page (`/available-slots`)**: Interactive 7-day calendar strip, available vs. unavailable time slots, and 1-click booking confirmation modal.
7. **Customer Dashboard (`/my-bookings`)**: Appointment hub for clients with upcoming, confirmed, past, and cancelled appointment tracking and one-click cancellation.
8. **Booking Details Page (`/booking-details`)**: Deep-dive record view with Slot ID, local/UTC time conversion, Bohr explorer link, and contextual actions.

### Key UX Highlights
* **Automatic Timezone Conversion**: On-chain Unix timestamps are automatically converted to the user's local timezone (e.g., CET, EST, PST) and UTC simultaneously.
* **1-Click Network Switcher**: Auto-detects wrong networks and prompts MetaMask to add or switch to BOT Chain Testnet (`0x3c8`).
* **Transaction Status Modal**: Live indicators for Signature Request, Broadcast, Bohr Confirmation, and Explorer links (`https://scan.bohr.life/tx/...`).
* **Zero Dummy Simulation**: Direct on-chain calls against BOT Chain Testnet.

---

## 🚀 Quickstart Guide

### 1. Install Dependencies
```bash
npm install
```

### 2. Compile Smart Contract
```bash
npm run compile
```
This compiles `contracts/OpenSlot.sol` using `solc` and outputs the ABI and bytecode into `src/artifacts/OpenSlot.json`.

### 3. Deploy to BOT Chain Testnet
1. Get testnet tokens from the faucet: [https://faucet.botchain.ai](https://faucet.botchain.ai)
2. Run the deploy script with your deployer private key:

```powershell
# Windows PowerShell
$env:PRIVATE_KEY="0xYOUR_TESTNET_PRIVATE_KEY"
npm run deploy:testnet
```

```bash
# Linux / macOS
PRIVATE_KEY="0xYOUR_TESTNET_PRIVATE_KEY" npm run deploy:testnet
```

The script deploys the contract to BOT Chain Testnet and automatically writes the deployed contract address to `src/config/contractAddress.json`.

### 4. Run the Frontend
```bash
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## 🔒 Security & Constraints
- **Strict Role Boundaries**: Only the business owner can confirm or cancel their slots. Only the booking customer can cancel their reservation.
- **No Double-Booking**: Contract state transition enforces `Available -> Booked`. Concurrent transactions for the same slot will revert for the second caller.
- **No Token/Payment Risks**: Pure scheduling logic with zero token/escrow risks.
- **Off-Chain Media**: Descriptions and images are kept off-chain, ensuring minimal storage footprint and zero on-chain bloat.

