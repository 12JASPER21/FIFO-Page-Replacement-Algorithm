function runSimulation() {
    const availRaw = document.getElementById('availablePages').value.trim();
    const refRaw = document.getElementById('referenceString').value.trim();
    const frameCount = parseInt(document.getElementById('frameCount').value);
    const resultDiv = document.getElementById('simulation-result');
    const errorMsg = document.getElementById('error-message');

    // Reset Display
    resultDiv.innerHTML = '';
    errorMsg.style.display = 'none';

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

    // --- FIFO ALGORITHM ---
    
    let frames = new Array(frameCount).fill(null);
    let hits = 0;
    let faults = 0;
    let queueIndex = 0;
    
    // Timeline Container
// Timeline Container
    // CHANGE: Added the "timeline-wrapper" div around the timeline-scroll
    let stepsHtml = '<div class="timeline-wrapper"><div class="timeline-scroll"><div class="step-container">';

    references.forEach((page, index) => {
        // ... (this inner logic stays exactly the same) ...
        let isHit = false;
        let changedFrameIndex = -1;

        if (frames.includes(page)) {
            hits++;
            isHit = true;
        } else {
            faults++;
            isHit = false;
            frames[queueIndex] = page;
            changedFrameIndex = queueIndex;
            queueIndex = (queueIndex + 1) % frameCount;
        }

        const delay = index * 0.15; 
        
        stepsHtml += `
            <div class="step-col glass-panel" style="animation-delay: ${delay}s">
                <div class="ref-val">${page}</div>
                <div class="frame-stack">
                    ${frames.map((f, frameIdx) => `
                        <div class="frame-box ${f === null ? 'empty' : ''} ${frameIdx === changedFrameIndex ? 'changed' : ''}">
                            ${f === null ? '-' : f}
                        </div>
                    `).join('')}
                </div>
                <div class="status-indicator">
                    ${isHit 
                        ? '<span style="color: var(--success)">✓</span>' 
                        : '<span style="color: var(--error)">✗</span>'}
                </div>
            </div>
        `;
    });

    // CHANGE: Close the extra wrapper div
    stepsHtml += '</div></div></div>';

    // Statistics Card - Added 'glass-panel' class
    const statsHtml = `
        <div class="stats-card glass-panel">
            <div class="stat-item">
                <span class="stat-label">Total Pages</span>
                <span class="stat-value">${references.length}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Hits</span>
                <span class="stat-value hit">${hits}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Faults</span>
                <span class="stat-value miss">${faults}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Hit Ratio</span>
                <span class="stat-value">${references.length > 0 ? ((hits/references.length)*100).toFixed(0) : 0}%</span>
            </div>
        </div>
    `;

    resultDiv.innerHTML = statsHtml + stepsHtml;
}

function clearAll() {
    document.getElementById('availablePages').value = '';
    document.getElementById('referenceString').value = '';
    document.getElementById('frameCount').value = '';
    document.getElementById('simulation-result').innerHTML = '';
    document.getElementById('error-message').style.display = 'none';
}