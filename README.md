# Blockchain Consensus Engine Simulator

**Built by Mohammed Irfaan**

## Overview
The Blockchain Consensus Engine Simulator is a full-stack educational web application designed to visually demonstrate how modern blockchain networks achieve consensus on new blocks of data. It provides a real-time, interactive comparison between the two most prominent consensus algorithms: **Proof of Work (PoW)** and **Proof of Stake (PoS)**.

## Key Features
- **Real-Time Simulation**: Watch a high-performance C++ backend race Proof of Work brute-forcing against Proof of Stake lottery forging in real-time.
- **Dynamic Visuals**: A neon-glowing, responsive frontend built with Vanilla JavaScript and CSS3 that visually tracks the blockchain lifecycle step-by-step.
- **Live Analytics**: Uses Chart.js to dynamically map the massive difference in "Energy Consumption" (Joules) and "Time Taken" (ms) between PoW and PoS.
- **Custom Payloads**: Users can inject their own custom transaction data into the simulated blocks.
- **The Avalanche Effect (Tamper Testing)**: Features a fully interactive Block Explorer. If a user modifies even a single character of a generated block's data, the application uses Web Crypto APIs to instantly recalculate the SHA-256 hash, visually breaking the chain and demonstrating blockchain immutability.

## Technology Stack
- **Backend (Consensus Core)**: C++ (Raw SHA-256 implementation, threaded loops, pseudo-random lotteries)
- **Bridge**: Node.js & Express (Child processes, Server-Sent Events for real-time streaming)
- **Frontend**: HTML5, CSS3, Vanilla ES6 JavaScript, Chart.js

## How It Works
When the "Simulate" button is clicked, the Node.js server spawns the compiled C++ engine in the background. The C++ engine executes the intensive math and outputs standard terminal logs. The Node server catches these logs and streams them to the browser via Server-Sent Events. The frontend JavaScript parses this stream to animate the UI, update charts, play Web Audio API sound effects, and construct the final interactive Block Explorer.
