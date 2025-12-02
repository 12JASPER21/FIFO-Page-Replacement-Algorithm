let simulationSteps = [];
let currentStepIndex = -1;
let playInterval = null;
let isPlaying = false;
let speed = 800;

function initSimulation() {
    const availRaw = document.getElementById('availablePages').value.trim();
    const refRaw = document.getElementById('referenceString').value.trim();
    const frameCount = parseInt(document.getElementById('frameCount').value);
    const resultDiv = document.getElementById('simulation-result');
    const controlsArea = document.getElementById('controls-area');
    const errorMsg = document.getElementById('error-message');

    // Reset State
    stopAutoPlay();
    currentStepIndex = -1;
    simulationSteps = [];
    resultDiv.innerHTML = '';
    errorMsg.style.display = 'none';
    controlsArea.style.display = 'none';

    if (!availRaw || !refRaw || !frameCount) {
        alert("Please fill in all fields.");
        return;
    }

    const validPages = availRaw.split(/\s+/);
    const references = refRaw.split(/\s+/);
    const invalidRefs = references.filter(ref => !validPages.includes(ref));
    
    if (invalidRefs.length > 0) {
        errorMsg.innerText = `Error: '${invalidRefs.join(", ")}' not found in Input String.`;
        errorMsg.style.display = 'block';
        return;
    }

    // --- 1. Pre-Calculate All Steps (Logic Phase) ---
    let frames = new Array(frameCount).fill(null);
    let queueIndex = 0;
    let totalHits = 0;
    let totalFaults = 0;

    references.forEach((page, index) => {
        let isHit = false;
        let changedIndex = -1;
        let explanation = "";
        let replacedPage = null;

        if (frames.includes(page)) {
            // HIT
            totalHits++;
            isHit = true;
            explanation = `Page <strong>${page}</strong> is already in memory. No replacement needed.`;
        } else {
            // FAULT
            totalFaults++;
            isHit = false;
            replacedPage = frames[queueIndex];
            frames[queueIndex] = page;
            changedIndex = queueIndex;
            
            if (replacedPage === null) {
                explanation = `Page <strong>${page}</strong> loaded into an empty frame.`;
            } else {
                explanation = `Page Fault. Replaced <strong>${replacedPage}</strong> with <strong>${page}</strong> (FIFO Rule).`;
            }
            
            queueIndex = (queueIndex + 1) % frameCount;
        }

        simulationSteps.push({
            stepId: index,
            page: page,
            framesSnapshot: [...frames], // Copy array
            isHit: isHit,
            changedIndex: changedIndex,
            explanation: explanation,
            currentStats: {
                processed: index + 1,
                hits: totalHits,
                faults: totalFaults,
                ratio: ((totalHits / (index + 1)) * 100).toFixed(0)
            }
        });
    });

    // --- 2. Build DOM Structure (Render Phase) ---
    renderStructure(simulationSteps.length);
    controlsArea.style.display = 'block';
    
    // Start at Step 0
    goToStep(0);
}

// Builds the grid but does not highlight anything yet
function renderStructure(totalSteps) {
    const resultDiv = document.getElementById('simulation-result');
    
    // Stats Card
    const statsHtml = `
        <div class="stats-card glass-panel">
            <div class="stat-item">
                <span class="stat-label">Total Steps</span>
                <span class="stat-value" id="disp-total">0</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Hits</span>
                <span class="stat-value hit" id="disp-hits">0</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Faults</span>
                <span class="stat-value miss" id="disp-faults">0</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Hit Ratio</span>
                <span class="stat-value" id="disp-ratio">0%</span>
            </div>
        </div>
    `;

    // Timeline
    let stepsHtml = '<div class="timeline-wrapper"><div class="timeline-scroll" id="timelineScroll"><div class="step-container">';
    
    simulationSteps.forEach((step, idx) => {
        stepsHtml += `
            <div id="step-${idx}" class="step-col" onclick="goToStep(${idx})">
                <div class="ref-val">${step.page}</div>
                <div class="frame-stack">
                    ${step.framesSnapshot.map((f, i) => `
                        <div class="frame-box ${f === null ? 'empty' : ''} ${i === step.changedIndex ? 'changed' : ''}">
                            ${f === null ? '-' : f}
                        </div>
                    `).join('')}
                </div>
                <div class="status-indicator">
                    ${step.isHit 
                        ? '<span style="color: var(--success)">✓</span>' 
                        : '<span style="color: var(--error)">✗</span>'}
                </div>
            </div>
        `;
    });
    stepsHtml += '</div></div></div>';

    resultDiv.innerHTML = statsHtml + stepsHtml;
}

// --- Navigation & State Management ---

function goToStep(index) {
    if (index < 0 || index >= simulationSteps.length) return;

    currentStepIndex = index;

    // 1. Update Columns Visuals
    const container = document.getElementById('timelineScroll');
    
    document.querySelectorAll('.step-col').forEach((el, idx) => {
        if (idx === index) {
            el.classList.add('active-step');

            // --- FIX: Manual Scroll Calculation ---
            // This ensures ONLY the timeline scrolls, not the whole page
            const scrollLeft = el.offsetLeft - (container.clientWidth / 2) + (el.clientWidth / 2);
            
            container.scrollTo({
                left: scrollLeft,
                behavior: 'smooth'
            });
            // --------------------------------------

        } else {
            el.classList.remove('active-step');
        }
    });

    // 2. Update Stats (Real-time)
    const data = simulationSteps[index];
    document.getElementById('disp-total').innerText = data.currentStats.processed;
    document.getElementById('disp-hits').innerText = data.currentStats.hits;
    document.getElementById('disp-faults').innerText = data.currentStats.faults;
    document.getElementById('disp-ratio').innerText = data.currentStats.ratio + '%';

    // 3. Update Explanation
    const typeLabel = data.isHit ? "<span style='color:var(--success)'>HIT</span>" : "<span style='color:var(--error)'>FAULT</span>";
    document.getElementById('step-text').innerHTML = `
        <strong>Step ${index + 1}:</strong> Processing Page ${data.page} &mdash; ${typeLabel} <br>
        <span style="font-size: 0.9em; opacity: 0.8">${data.explanation}</span>
    `;

    // Check if finished
    if (index === simulationSteps.length - 1) {
        stopAutoPlay();
    }
}

function nextStep() {
    if (currentStepIndex < simulationSteps.length - 1) {
        goToStep(currentStepIndex + 1);
    } else {
        stopAutoPlay(); // Stop if at end
    }
}

function prevStep() {
    if (currentStepIndex > 0) {
        stopAutoPlay(); // Stop auto play if user manually goes back
        goToStep(currentStepIndex - 1);
    }
}

function togglePlay() {
    if (isPlaying) {
        stopAutoPlay();
    } else {
        startAutoPlay();
    }
}

function startAutoPlay() {
    if (currentStepIndex >= simulationSteps.length - 1) {
        // Restart if at end
        currentStepIndex = -1;
    }
    
    isPlaying = true;
    document.getElementById('playPauseBtn').innerHTML = '<i class="fas fa-pause"></i>';
    
    // Immediate next step
    nextStep();
    
    playInterval = setInterval(() => {
        nextStep();
    }, speed);
}

function stopAutoPlay() {
    isPlaying = false;
    clearInterval(playInterval);
    const btn = document.getElementById('playPauseBtn');
    if(btn) btn.innerHTML = '<i class="fas fa-play"></i>';
}

function updateSpeed() {
    speed = parseInt(document.getElementById('speedSelect').value);
    if (isPlaying) {
        // Reset interval with new speed
        clearInterval(playInterval);
        playInterval = setInterval(nextStep, speed);
    }
}

function clearAll() {
    stopAutoPlay();
    document.getElementById('availablePages').value = '';
    document.getElementById('referenceString').value = '';
    document.getElementById('frameCount').value = '';
    document.getElementById('simulation-result').innerHTML = '';
    document.getElementById('controls-area').style.display = 'none';
    document.getElementById('error-message').style.display = 'none';
}
