#include <iostream>
#include <vector>
#include <string>
#include <chrono>
#include <map>
#include <random>
#include <thread>
#include "sha256.hpp"

// Assume a generic CPU Wattage for Energy Reality Metric (e.g., 65W for a standard desktop CPU)
const double CPU_WATTAGE = 65.0;

class Block {
public:
    int index;
    std::string timestamp;
    std::string data;
    std::string previousHash;
    std::string hash;
    long long nonce;

    Block(int idx, std::string ts, std::string d, std::string prevHash)
        : index(idx), timestamp(ts), data(d), previousHash(prevHash), nonce(0) {
        hash = calculateHash();
    }

    // Calculates the SHA-256 hash using the header-only logic provided
    std::string calculateHash() const {
        return sha256(std::to_string(index) + timestamp + data + previousHash + std::to_string(nonce));
    }

    /**
     * Proof of Work Algorithm
     */
    void mineBlock(int difficulty, int sleepTime) {
        std::cout << "   [Step 1] Receiving Transaction Data...\n";
        std::this_thread::sleep_for(std::chrono::milliseconds(sleepTime));

        std::cout << "   [Step 2] Setting Target Difficulty (" << difficulty << " zeros)...\n";
        std::this_thread::sleep_for(std::chrono::milliseconds(sleepTime));

        std::cout << "   [Step 3] Brute-forcing nonce (this will take time)...\n";
        
        std::string target(difficulty, '0');
        
        // Start Timer
        auto start = std::chrono::high_resolution_clock::now();

        // Mine until hash starts with target zeros
        while (hash.substr(0, difficulty) != target) {
            nonce++;
            hash = calculateHash();
        }

        // End Timer
        auto end = std::chrono::high_resolution_clock::now();
        std::chrono::duration<double, std::milli> duration = end - start;
        
        double timeTakenMs = duration.count();
        double timeTakenSec = timeTakenMs / 1000.0;
        
        // Feature 1: The "Energy Reality" Metric
        double estimatedEnergy = timeTakenSec * CPU_WATTAGE; // Joules (Watt-seconds)

        std::cout << "   [Step 4] Validating resulting Hash...\n";
        std::this_thread::sleep_for(std::chrono::milliseconds(sleepTime));

        std::cout << "   [Step 5] Block Added successfully!\n";
        std::this_thread::sleep_for(std::chrono::milliseconds(sleepTime));

        std::cout << "[PoW] Block Mined Successfully!\n";
        std::cout << "      Hash  : " << hash << "\n";
        std::cout << "      Nonce : " << nonce << "\n";
        std::cout << "      Time  : " << timeTakenMs << " ms\n";
        std::cout << "      Energy: " << estimatedEnergy << " Joules (Est. at " << CPU_WATTAGE << "W CPU)\n";
    }

    /**
     * Proof of Stake Algorithm
     */
    void forgeBlock(const std::map<std::string, int>& validators, int sleepTime) {
        std::cout << "   [Step 1] Receiving Transaction Data...\n";
        std::this_thread::sleep_for(std::chrono::milliseconds(sleepTime));

        int totalStake = 0;
        for (const auto& pair : validators) {
            totalStake += pair.second;
        }

        // Feature 2: The "Validator Integrity" Check
        if (totalStake <= 0) {
            std::cerr << "[PoS] ERROR: Total stake is zero or negative. Cannot safely select a validator.\n";
            return;
        }

        std::cout << "   [Step 2] Checking active stakes in the network...\n";
        std::this_thread::sleep_for(std::chrono::milliseconds(sleepTime));

        std::cout << "   [Step 3] Running weighted random draw...\n";
        std::this_thread::sleep_for(std::chrono::milliseconds(sleepTime));

        // Start Timer for Algorithm
        auto start = std::chrono::high_resolution_clock::now();

        // Weighted random selection algorithm
        std::random_device rd;
        std::mt19937 gen(rd());
        std::uniform_int_distribution<> distrib(1, totalStake);
        
        int randomValue = distrib(gen);
        int currentSum = 0;
        std::string selectedValidator = "Unknown";

        for (const auto& pair : validators) {
            currentSum += pair.second;
            if (randomValue <= currentSum) {
                selectedValidator = pair.first;
                break;
            }
        }

        // Block is successfully forged; recalculate hash once
        hash = calculateHash(); 
        
        // End Timer
        auto end = std::chrono::high_resolution_clock::now();
        std::chrono::duration<double, std::milli> duration = end - start;

        std::cout << "   [Step 4] Selected Forger (" << selectedValidator << ") is signing the block...\n";
        std::this_thread::sleep_for(std::chrono::milliseconds(sleepTime));

        std::cout << "   [Step 5] Block Added successfully!\n";
        std::this_thread::sleep_for(std::chrono::milliseconds(sleepTime));

        std::cout << "[PoS] Block Forged Successfully!\n";
        std::cout << "      Forger: " << selectedValidator << "\n";
        std::cout << "      Hash  : " << hash << "\n";
        std::cout << "      Time  : " << duration.count() << " ms\n";
    }
};

int main(int argc, char* argv[]) {
    std::vector<Block> blockchain;

    int difficulty = 5;
    int alphaStake = 500;
    int betaStake = 300;
    int gammaStake = 200;
    int numBlocks = 1;
    std::string customData = "Network initialization payload";

    if (argc >= 7) {
        difficulty = std::stoi(argv[1]);
        alphaStake = std::stoi(argv[2]);
        betaStake = std::stoi(argv[3]);
        gammaStake = std::stoi(argv[4]);
        numBlocks = std::stoi(argv[5]);
        customData = argv[6];
    }
    
    int sleepTime = (numBlocks > 1) ? 400 : 1800;

    std::cout << "========================================================\n";
    std::cout << "        BLOCKCHAIN CONSENSUS SIMULATOR (PoW vs PoS)     \n";
    std::cout << "========================================================\n\n";

    // Genesis Block
    std::cout << "[SYSTEM] Initializing Genesis Block...\n";
    Block genesis(0, "2026-04-22 10:00:00", "Genesis Block", "0");
    blockchain.push_back(genesis);
    std::cout << "[SYSTEM] Genesis Hash: " << genesis.hash << "\n\n";

    // RACE SIMULATION: PoW vs PoS
    std::cout << "--- RACE START: Proof of Work vs. Proof of Stake ---\n\n";

    std::map<std::string, int> validators = {
        {"Alpha_Node", alphaStake},
        {"Beta_Node", betaStake},
        {"Gamma_Node", gammaStake}
    };

    for (int i = 0; i < numBlocks; ++i) {
        // 1. Proof of Work (PoW) simulation
        std::cout << ">> Initiating Proof of Work (PoW)...\n";
        std::this_thread::sleep_for(std::chrono::milliseconds(sleepTime));
        Block powBlock(blockchain.size(), "2026-04-22 10:05:00", "PoW: " + customData + (numBlocks > 1 ? " [" + std::to_string(i+1) + "]" : ""), blockchain.back().hash);
        std::cout << ">> Target Difficulty: " << difficulty << " leading zeros\n";
        powBlock.mineBlock(difficulty, sleepTime);
        blockchain.push_back(powBlock);

        std::cout << "\n--------------------------------------------------------\n\n";

        // 2. Proof of Stake (PoS) simulation
        std::cout << ">> Initiating Proof of Stake (PoS)...\n";
        std::this_thread::sleep_for(std::chrono::milliseconds(sleepTime));
        Block posBlock(blockchain.size(), "2026-04-22 10:10:00", "PoS: " + customData + (numBlocks > 1 ? " [" + std::to_string(i+1) + "]" : ""), blockchain.back().hash);
        
        std::cout << ">> Active Validators and Stake:\n";
        for (const auto& v : validators) {
            std::cout << "   - " << v.first << ": " << v.second << " staked tokens\n";
        }
        std::cout << "\n";
        
        posBlock.forgeBlock(validators, sleepTime);
        blockchain.push_back(posBlock);

        std::cout << "\n--------------------------------------------------------\n\n";
    }

    // 3. Testing Validator Integrity Check
    std::cout << ">> Testing PoS Validator Integrity Check (Zero Stake scenario)...\n";
    Block invalidPosBlock(blockchain.size(), "2026-04-22 10:15:00", "Invalid PoS Request", blockchain.back().hash);
    std::map<std::string, int> emptyValidators = {
        {"Rogue_Node1", 0},
        {"Rogue_Node2", 0}
    };
    invalidPosBlock.forgeBlock(emptyValidators, sleepTime);

    std::cout << "\n[JSON_LEDGER_START]\n";
    std::cout << "[\n";
    for (size_t i = 0; i < blockchain.size(); ++i) {
        std::cout << "  {\n";
        std::cout << "    \"index\": " << blockchain[i].index << ",\n";
        std::cout << "    \"timestamp\": \"" << blockchain[i].timestamp << "\",\n";
        std::cout << "    \"data\": \"" << blockchain[i].data << "\",\n";
        std::cout << "    \"previousHash\": \"" << blockchain[i].previousHash << "\",\n";
        std::cout << "    \"hash\": \"" << blockchain[i].hash << "\",\n";
        std::cout << "    \"nonce\": " << blockchain[i].nonce << "\n";
        std::cout << "  }";
        if (i < blockchain.size() - 1) std::cout << ",";
        std::cout << "\n";
    }
    std::cout << "]\n";
    std::cout << "[JSON_LEDGER_END]\n";

    std::cout << "\n========================================================\n";
    std::cout << "                  SIMULATION COMPLETE                   \n";
    std::cout << "========================================================\n";

    return 0;
}
