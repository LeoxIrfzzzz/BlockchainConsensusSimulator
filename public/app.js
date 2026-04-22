document.addEventListener('DOMContentLoaded', () => {
    const runBtn = document.getElementById('run-btn');
    const terminal = document.getElementById('terminal');
    const commentary = document.getElementById('live-commentary');
    
    // Dashboard elements
    const powCard = document.querySelector('.pow-card');
    const posCard = document.querySelector('.pos-card');
    const powTime = document.getElementById('pow-time');
    const powEnergy = document.getElementById('pow-energy');
    const posTime = document.getElementById('pos-time');
    const posForger = document.getElementById('pos-forger');

    let totalPowEnergy = 0;
    let totalPowTime = 0;
    let totalPosTime = 0;
    let energyChart, timeChart;
    
    function initCharts() {
        if(energyChart) energyChart.destroy();
        if(timeChart) timeChart.destroy();
        Chart.defaults.color = 'rgba(255, 255, 255, 0.7)';
        
        const ctxEnergy = document.getElementById('energyChart').getContext('2d');
        energyChart = new Chart(ctxEnergy, {
            type: 'bar',
            data: { labels: ['PoW Energy', 'PoS Energy'], datasets: [{ label: 'Joules', data: [0, 0], backgroundColor: ['rgba(245, 158, 11, 0.7)', 'rgba(59, 130, 246, 0.7)'], borderColor: ['#f59e0b', '#3b82f6'], borderWidth: 1 }] },
            options: { responsive: true, scales: { y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.1)' } }, x: { grid: { display: false } } }, plugins: { legend: { display: false } } }
        });

        const ctxTime = document.getElementById('timeChart').getContext('2d');
        timeChart = new Chart(ctxTime, {
            type: 'bar',
            data: { labels: ['PoW Time', 'PoS Time'], datasets: [{ label: 'Milliseconds', data: [0, 0], backgroundColor: ['rgba(245, 158, 11, 0.7)', 'rgba(59, 130, 246, 0.7)'], borderColor: ['#f59e0b', '#3b82f6'], borderWidth: 1 }] },
            options: { responsive: true, scales: { y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.1)' } }, x: { grid: { display: false } } }, plugins: { legend: { display: false } } }
        });
    }

    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    function playSound(type) {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        osc.connect(gainNode); gainNode.connect(audioCtx.destination);
        
        if (type === 'tick') {
            osc.type = 'sine'; osc.frequency.setValueAtTime(800, audioCtx.currentTime); osc.frequency.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);
            gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime); osc.start(); osc.stop(audioCtx.currentTime + 0.05);
        } else if (type === 'success') {
            osc.type = 'sine'; osc.frequency.setValueAtTime(400, audioCtx.currentTime); osc.frequency.setValueAtTime(600, audioCtx.currentTime + 0.1);
            gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime); gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
            osc.start(); osc.stop(audioCtx.currentTime + 0.3);
        }
    }
    
    initCharts();

    let currentContext = 'system';

    function updateStep(type, stepNum, state) {
        const stepEl = document.getElementById(`${type}-step-${stepNum}`);
        if(!stepEl) return;
        stepEl.classList.remove('active-pow', 'active-pos', 'completed');
        if(state === 'active') stepEl.classList.add(`active-${type}`);
        else if (state === 'completed') stepEl.classList.add('completed');
    }

    function resetVisualizer() {
        for(let i=1; i<=5; i++) {
            updateStep('pow', i, 'reset');
            updateStep('pos', i, 'reset');
        }
        document.querySelectorAll('.pos-node').forEach(n => n.classList.remove('highlight'));
    }

    function setCommentary(text) {
        commentary.style.opacity = '0';
        setTimeout(() => {
            commentary.textContent = text;
            commentary.style.opacity = '1';
        }, 300);
    }

    let isParsingLedger = false;
    let ledgerJsonString = "";

    async function sha256(message) {
        const msgBuffer = new TextEncoder().encode(message);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    async function recomputeHashes(blocks, fromIndex) {
        for (let i = fromIndex; i < blocks.length; i++) {
            const b = blocks[i];
            const oldHash = b.hash;
            const newHash = await sha256(b.index + b.timestamp + b.data + b.previousHash + b.nonce);
            b.hash = newHash;
            
            const card = document.getElementById(`block-card-${i}`);
            if (oldHash !== newHash || i > fromIndex) {
                card.style.borderColor = '#ef4444';
                card.style.boxShadow = '0 0 15px rgba(239, 68, 68, 0.4)';
                card.querySelector('.current').style.borderLeftColor = '#ef4444';
                card.querySelector('.current-hash').style.color = '#ef4444';
            }
            card.querySelector('.current-hash').textContent = b.hash;

            if (i + 1 < blocks.length) {
                blocks[i + 1].previousHash = b.hash;
                const nextCard = document.getElementById(`block-card-${i + 1}`);
                if (nextCard) nextCard.querySelector('.prev-hash').textContent = b.hash;
            }
        }
    }

    function renderBlockExplorer(blocks) {
        const explorer = document.getElementById('block-explorer');
        explorer.innerHTML = '';
        
        blocks.forEach((block, idx) => {
            const card = document.createElement('div');
            card.className = 'block-card';
            card.id = `block-card-${idx}`;
            card.innerHTML = `
                <div class="block-index">Block #${block.index}</div>
                <div class="block-row"><strong>Timestamp:</strong> ${block.timestamp}</div>
                <div class="block-row"><strong>Data:</strong> <input type="text" class="tamper-input" data-index="${idx}" value="${block.data}" style="background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.2); color:#fff; padding:4px; border-radius:4px; width:100%; font-family:monospace; font-size:0.8rem;"></div>
                <div class="block-row"><strong>Nonce:</strong> ${block.nonce}</div>
                <div class="block-hash-box">
                    <div class="hash-label">Previous Hash</div>
                    <div class="hash-val prev-hash" id="prev-hash-${idx}">${block.previousHash}</div>
                </div>
                <div class="block-hash-box current">
                    <div class="hash-label">Block Hash</div>
                    <div class="hash-val current-hash" id="current-hash-${idx}">${block.hash}</div>
                </div>
            `;
            explorer.appendChild(card);
        });

        document.querySelectorAll('.tamper-input').forEach(input => {
            input.addEventListener('input', async (e) => {
                const idx = parseInt(e.target.dataset.index);
                blocks[idx].data = e.target.value;
                await recomputeHashes(blocks, idx);
            });
        });
    }

    window.handleWasmLog = function(text, isError = false) {
        appendLog(text, isError);
    };

    function appendLog(text, isError = false) {
        if (text === '[JSON_LEDGER_START]') {
            isParsingLedger = true;
            ledgerJsonString = "";
            return;
        }
        if (text === '[JSON_LEDGER_END]') {
            isParsingLedger = false;
            try {
                const blocks = JSON.parse(ledgerJsonString);
                renderBlockExplorer(blocks);
            } catch(e) {
                console.error("Failed to parse ledger JSON", e);
            }
            return;
        }
        if (isParsingLedger) {
            ledgerJsonString += text;
            return;
        }

        const line = document.createElement('div');
        line.className = 'log-line';
        line.textContent = text;
        
        if (isError) {
            line.classList.add('error');
        } else {
            // Synchronized Workflow Logic
            if (text.includes('>> Initiating Proof of Work (PoW)')) {
                currentContext = 'pow';
                powCard.classList.add('active');
                posCard.classList.remove('active');
            } 
            else if (text.includes('>> Initiating Proof of Stake (PoS)')) {
                currentContext = 'pos';
                powCard.classList.remove('active');
                posCard.classList.add('active');
            }

            // Sync steps directly to C++ output delays
            if (text.includes('[Step 1] Receiving')) {
                updateStep(currentContext, 1, 'active');
                setCommentary("The network has received a new transaction and is packaging it into a raw Block.");
            }
            else if (text.includes('[Step 2] Setting Target')) {
                updateStep('pow', 1, 'completed');
                updateStep('pow', 2, 'active');
                setCommentary("Proof of Work algorithm sets a strict mathematical target (leading zeros) that miners must solve.");
            }
            else if (text.includes('[Step 3] Brute-forcing')) {
                updateStep('pow', 2, 'completed');
                updateStep('pow', 3, 'active');
                setCommentary("Miners are using massive computational energy to guess millions of nonces per second to find the correct hash.");
                playSound('tick');
            }
            else if (text.includes('[Step 4] Validating')) {
                updateStep('pow', 3, 'completed');
                updateStep('pow', 4, 'active');
                setCommentary("The hash has been found! The network quickly verifies the math is correct.");
            }
            else if (text.includes('[Step 2] Checking active stakes')) {
                updateStep('pos', 1, 'completed');
                updateStep('pos', 2, 'active');
                setCommentary("Proof of Stake scans the network to see how many tokens each validator has locked up.");
            }
            else if (text.includes('[Step 3] Running weighted random draw')) {
                updateStep('pos', 2, 'completed');
                updateStep('pos', 3, 'active');
                setCommentary("The system runs a low-energy lottery. The more stake you hold, the higher your chance of winning!");
                playSound('tick');
            }
            else if (text.includes('[Step 4] Selected Forger')) {
                updateStep('pos', 3, 'completed');
                updateStep('pos', 4, 'active');
                setCommentary("The winning validator has been selected and is now cryptographically signing the block.");
                
                // Highlight winning node visually
                const forgerMatch = text.match(/\((.*?)\)/);
                if(forgerMatch) {
                    document.querySelectorAll('.pos-node').forEach(n => { n.style.background = 'rgba(0,0,0,0.4)'; n.style.color = 'var(--text-muted)'; n.style.boxShadow = 'none'; });
                    const node = document.getElementById(`node-${forgerMatch[1]}`);
                    if(node) {
                        node.style.background = 'rgba(59, 130, 246, 0.2)';
                        node.style.color = '#3b82f6';
                        node.style.boxShadow = '0 0 20px rgba(59, 130, 246, 0.5)';
                    }
                }
            }
            else if (text.includes('[Step 5] Block Added')) {
                updateStep(currentContext, 4, 'completed');
                updateStep(currentContext, 5, 'active');
                setTimeout(() => { updateStep(currentContext, 5, 'completed'); }, 800);
                setCommentary("Consensus achieved! The new block is permanently secured on the blockchain ledger.");
                playSound('success');
            }
            else if (text.includes('SIMULATION COMPLETE')) {
                setCommentary("Simulation Complete. Awaiting next initialization.");
            }

            if (currentContext === 'pow') line.classList.add('pow');
            if (currentContext === 'pos') line.classList.add('pos');
            if (text.includes('Successfully')) line.classList.add('success');
            if (text.includes('[SYSTEM]') || text.includes('SIMULATION COMPLETE')) line.classList.add('system');
        }

        terminal.appendChild(line);
        terminal.scrollTop = terminal.scrollHeight;
        
        parseMetrics(text);
    }

    function parseMetrics(text) {
        if (currentContext === 'pow') {
            const timeMatch = text.match(/Time\s*:\s*([\d.]+)\s*ms/);
            if (timeMatch) { 
                const val = parseFloat(timeMatch[1]);
                powTime.textContent = `${val.toFixed(2)} ms`; 
                totalPowTime += val; timeChart.data.datasets[0].data[0] = totalPowTime; timeChart.update(); 
            }

            const energyMatch = text.match(/Energy:\s*([\d.]+)\s*Joules/);
            if (energyMatch) { 
                const val = parseFloat(energyMatch[1]);
                powEnergy.textContent = `${val.toFixed(2)} Joules`; 
                totalPowEnergy += val; energyChart.data.datasets[0].data[0] = totalPowEnergy; energyChart.update(); 
            }
        }
        if (currentContext === 'pos') {
            const timeMatch = text.match(/Time\s*:\s*([\d.]+)\s*ms/);
            if (timeMatch) { 
                const val = parseFloat(timeMatch[1]);
                posTime.textContent = `${val.toFixed(2)} ms`; 
                totalPosTime += val; timeChart.data.datasets[0].data[1] = totalPosTime; timeChart.update(); 
            }

            const forgerMatch = text.match(/Forger:\s*(\w+)/);
            if (forgerMatch) posForger.textContent = forgerMatch[1];
        }
    }

    function resetDashboard() {
        powTime.textContent = '-- ms';
        powEnergy.textContent = '-- Joules';
        posTime.textContent = '-- ms';
        posForger.textContent = '--';
        powCard.classList.remove('active');
        posCard.classList.remove('active');
        resetVisualizer();
        setCommentary("Connecting to local C++ engine...");
        
        totalPowEnergy = 0; totalPowTime = 0; totalPosTime = 0;
        energyChart.data.datasets[0].data = [0, 0]; energyChart.update();
        timeChart.data.datasets[0].data = [0, 0]; timeChart.update();
        
        document.querySelectorAll('.pos-node').forEach(n => { n.style.background = 'rgba(0,0,0,0.4)'; n.style.color = 'var(--text-muted)'; n.style.boxShadow = 'none'; });

        currentContext = 'system';
        terminal.innerHTML = '';
        appendLog('[SYSTEM] Requesting simulation start...', false);
    }

    runBtn.addEventListener('click', () => {
        if(audioCtx.state === 'suspended') audioCtx.resume();
        runBtn.disabled = true;
        runBtn.querySelector('.btn-text').textContent = 'SIMULATING...';
        resetDashboard();

        const diff = document.getElementById('pow-diff').value;
        const alpha = document.getElementById('alpha-stake').value;
        const beta = document.getElementById('beta-stake').value;
        const gamma = document.getElementById('gamma-stake').value;
        const numBlocks = document.getElementById('num-blocks').value;
        const customData = document.getElementById('custom-data').value;

        setTimeout(() => {
            if (!window.Module || !window.Module.callMain) {
                appendLog("[SYSTEM] ERROR: WebAssembly engine is still loading. Please wait a second.", true);
                runBtn.disabled = false;
                runBtn.querySelector('.btn-text').textContent = 'RE-RUN SIMULATION';
                return;
            }

            try {
                // Execute natively in browser via WASM
                window.Module.callMain([diff, alpha, beta, gamma, numBlocks, customData]);
                
                runBtn.disabled = false;
                runBtn.querySelector('.btn-text').textContent = 'RE-RUN SIMULATION';
                powCard.classList.remove('active');
                posCard.classList.remove('active');
                appendLog('[SYSTEM] Simulation connection closed.', false);
            } catch(e) {
                console.error('WASM Error:', e);
                runBtn.disabled = false;
                runBtn.querySelector('.btn-text').textContent = 'INITIALIZE SIMULATION';
                appendLog('[SYSTEM] Engine Error: ' + e, true);
            }
        }, 100);
    });
});
