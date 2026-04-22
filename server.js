const express = require('express');
const { spawn, execSync } = require('child_process');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

const cppFile = path.join(__dirname, 'main.cpp');
const exeFile = path.join(__dirname, process.platform === 'win32' ? 'sim.exe' : 'sim');

// Compile C++ engine synchronously on server startup
try {
    console.log("Compiling C++ simulation engine for production...");
    execSync(`g++ "${cppFile}" -o "${exeFile}"`);
    console.log("Compilation successful.");
} catch (error) {
    console.error("Failed to compile C++ engine. Ensure g++ is installed:", error.message);
}

app.get('/simulate', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const diff = req.query.diff || '5';
    const alpha = req.query.alpha || '500';
    const beta = req.query.beta || '300';
    const gamma = req.query.gamma || '200';
    const numBlocks = req.query.numBlocks || '1';
    const customData = req.query.customData || 'Network initialization payload';

    // Run the compiled executable with dynamic parameters
    const sim = spawn(exeFile, [diff, alpha, beta, gamma, numBlocks, customData]);

    sim.on('error', (err) => {
        res.write(`data: ${JSON.stringify({ text: "[SYSTEM] Failed to run simulation: " + err.message, error: true })}\n\n`);
        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        return res.end();
    });

        let stdoutBuffer = '';
        sim.stdout.on('data', (data) => {
            stdoutBuffer += data.toString();
            const lines = stdoutBuffer.split('\n');
            stdoutBuffer = lines.pop();
            lines.forEach(line => {
                const trimmed = line.replace(/\r/g, '');
                if (trimmed.length > 0) {
                    res.write(`data: ${JSON.stringify({ text: trimmed })}\n\n`);
                }
            });
        });

        let stderrBuffer = '';
        sim.stderr.on('data', (data) => {
            stderrBuffer += data.toString();
            const lines = stderrBuffer.split('\n');
            stderrBuffer = lines.pop();
            lines.forEach(line => {
                const trimmed = line.replace(/\r/g, '');
                if (trimmed.length > 0) {
                    res.write(`data: ${JSON.stringify({ text: trimmed, error: true })}\n\n`);
                }
            });
        });

        sim.on('close', (code) => {
            if (stdoutBuffer.length > 0) {
                const trimmed = stdoutBuffer.replace(/\r/g, '');
                if (trimmed.length > 0) res.write(`data: ${JSON.stringify({ text: trimmed })}\n\n`);
            }
            if (stderrBuffer.length > 0) {
                const trimmed = stderrBuffer.replace(/\r/g, '');
                if (trimmed.length > 0) res.write(`data: ${JSON.stringify({ text: trimmed, error: true })}\n\n`);
            }
            res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
            res.end();
        });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`Open http://localhost:${PORT} in your browser.`);
});
