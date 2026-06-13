// ✅ 1. DYNAMIC API URL (LOCAL vs PRODUCTION)
const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:5000'
    : 'https://big-o-calculator.onrender.com';

console.log(`🔗 API Endpoint: ${API_URL}`);

// ✅ 2. DOM ELEMENTS
const analyzeBtn = document.getElementById('analyzeBtn');
const btnText = document.getElementById('btnText');
const btnSpinner = document.getElementById('btnSpinner');
const resultBox = document.getElementById('resultBox');
const errorBox = document.getElementById('errorBox') || createErrorBox();

// ✅ 3. CHART STATE
let timeChart = null;
let spaceChart = null;
const xValues = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// ✅ 4. CODE EDITOR SETUP
const editor = CodeMirror.fromTextArea(document.getElementById("codeInput"), {
    lineNumbers: true,
    mode: "text/x-c++src",
    theme: "dracula",
    indentUnit: 4,
    matchBrackets: true,
    lineWrapping: true
});

// ✅ 5. CREATE ERROR BOX IF MISSING
function createErrorBox() {
    const box = document.createElement('div');
    box.id = 'errorBox';
    box.className = 'error-box hidden';
    box.setAttribute('role', 'alert');
    box.setAttribute('aria-live', 'assertive');
    document.body.appendChild(box);
    return box;
}

// ✅ 6. SHOW ERROR WITH TIMEOUT
function showError(message) {
    errorBox.textContent = `❌ ${message}`;
    errorBox.classList.remove('hidden');
    setTimeout(() => {
        errorBox.classList.add('hidden');
    }, 5000);
}

// ✅ 7. FORMAT COMPLEXITY OUTPUT
const formatComplexity = (str) => {
    return str
        .replace(/\^(\d+)/g, '<sup>$1</sup>')
        .replace(/\^n/g, '<sup>n</sup>')
        .replace(/o\(/gi, 'O(');
};

// ✅ 8. OPTIMIZATION TIPS
const getOptimizationTip = (complexity) => {
    const comp = complexity.toLowerCase();
    if (comp.includes('n^2')) return "💡 Tip: Can you use a HashMap or Two-Pointers to reduce this?";
    if (comp.includes('nlogn')) return "💡 Tip: Great efficiency! Sorting is usually the bottleneck here.";
    if (comp.includes('1')) return "💡 Tip: Perfect! This is O(1) constant time.";
    if (comp.includes('logn')) return "💡 Tip: Excellent! Binary search complexity achieved.";
    if (comp.includes('2^n')) return "⚠️ Warning: Exponential complexity. Consider memoization or DP.";
    return "💡 Tip: Keep experimenting with data structures to optimize further.";
};

// ✅ 9. GENERATE GRAPH DATA
const generateGraphData = (complexity) => {
    if (!complexity) return xValues.map(() => 0);
    
    const str = complexity.replace(/\s+/g, '').toLowerCase();
    if (str.includes('1')) return xValues.map(() => 1);
    if (str.includes('logn') && !str.includes('nlogn')) return xValues.map(x => Math.log2(x));
    if (str.includes('nlogn')) return xValues.map(x => x * Math.log2(x));
    if (str.includes('n^2') || str.includes('n*n')) return xValues.map(x => x * x);
    if (str.includes('n^3')) return xValues.map(x => Math.pow(x, 3));
    if (str.includes('2^n')) return xValues.map(x => Math.pow(2, x));
    return xValues.map(x => x); // Default: O(n)
};

// ✅ 10. RENDER CHART WITH CLEANUP
const renderChart = (canvasId, existingChart, complexity) => {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;
    
    const ctx = canvas.getContext('2d');
    if (existingChart) existingChart.destroy();
    
    // Create gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, 150);
    gradient.addColorStop(0, 'rgba(59, 130, 246, 0.4)');
    gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
    
    return new Chart(ctx, {
        type: 'line',
        data: {
            labels: xValues,
            datasets: [{
                data: generateGraphData(complexity),
                borderColor: '#3b82f6',
                borderWidth: 3,
                tension: 0.4,
                pointRadius: 3,
                pointBackgroundColor: '#3b82f6',
                fill: true,
                backgroundColor: gradient
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { 
                legend: { display: false },
                tooltip: { 
                    enabled: true, 
                    mode: 'index', 
                    intersect: false, 
                    callbacks: { 
                        label: (item) => `Ops: ${Math.round(item.raw)}` 
                    } 
                } 
            },
            scales: { 
                x: { 
                    display: true, 
                    title: { display: true, text: 'Input Size (n)', color: '#666' }, 
                    grid: { display: false } 
                }, 
                y: { 
                    display: true, 
                    title: { display: true, text: 'Operations', color: '#666' },
                    beginAtZero: true
                } 
            }
        }
    });
};

// ✅ 11. MAIN ANALYSIS HANDLER
analyzeBtn.addEventListener('click', async () => {
    const code = editor.getValue();
    
    // ✅ VALIDATE INPUT
    if (!code.trim()) {
        analyzeBtn.classList.add('shake');
        setTimeout(() => analyzeBtn.classList.remove('shake'), 300);
        showError("Please enter some code to analyze");
        return;
    }

    if (code.length > 10000) {
        showError("Code exceeds 10KB limit");
        return;
    }

    // ✅ DISABLE & SHOW LOADING
    analyzeBtn.disabled = true;
    btnSpinner.classList.remove('hidden');
    errorBox.classList.add('hidden');
    resultBox.classList.add('hidden');
    
    const messages = ["Analyzing logic...", "Computing complexity...", "Mapping curves..."];
    let msgIndex = 0;
    const msgInterval = setInterval(() => {
        btnText.innerText = messages[msgIndex % messages.length];
        msgIndex++;
    }, 1200);

    try {
        // ✅ FETCH WITH TIMEOUT
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        const response = await fetch(`${API_URL}/analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code }),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        // ✅ CHECK RESPONSE STATUS
        if (!response.ok) {
            throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        // ✅ VALIDATE RESPONSE DATA
        if (data.error) {
            throw new Error(data.error);
        }

        if (!data.time_complexity || !data.space_complexity) {
            throw new Error("Invalid response format from server");
        }

        // ✅ SUCCESS STATE
        clearInterval(msgInterval);
        btnSpinner.classList.add('hidden');
        btnText.innerText = "✓ Analysis Complete";
        analyzeBtn.classList.add('success-btn', 'checkmark');

        // ✅ UPDATE RESULTS
        resultBox.classList.remove('hidden');
        resultBox.classList.add('pop-in');

        document.getElementById('timeResult').innerHTML = formatComplexity(data.time_complexity);
        document.getElementById('spaceResult').innerHTML = formatComplexity(data.space_complexity);
        document.getElementById('tipBox').innerText = getOptimizationTip(data.time_complexity);

        // ✅ RENDER CHARTS
        timeChart = renderChart('timeChart', timeChart, data.time_complexity);
        spaceChart = renderChart('spaceChart', spaceChart, data.space_complexity);

        // ✅ RESET BUTTON
        setTimeout(() => {
            analyzeBtn.classList.remove('success-btn', 'checkmark');
            btnText.innerText = "Run Analysis";
            analyzeBtn.disabled = false;
        }, 2000);

    } catch (error) {
        clearInterval(msgInterval);
        btnSpinner.classList.add('hidden');
        btnText.innerText = "Run Analysis";
        analyzeBtn.disabled = false;

        // ✅ USER-FRIENDLY ERROR MESSAGES
        let errorMsg = error.message;
        
        if (error.name === 'AbortError') {
            errorMsg = "Request timeout. Server may be slow.";
        } else if (errorMsg.includes('Failed to fetch')) {
            errorMsg = `Cannot reach server at ${API_URL}. Check if backend is running.`;
        } else if (errorMsg.includes('JSON')) {
            errorMsg = "Server returned invalid data format.";
        }

        showError(errorMsg);
        console.error("🔴 ANALYSIS ERROR:", error);
    }
});