const analyzeBtn = document.getElementById('analyzeBtn');
const btnText = document.getElementById('btnText');
const btnSpinner = document.getElementById('btnSpinner');

let timeChart = null;
let spaceChart = null;
const xValues = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const editor = CodeMirror.fromTextArea(document.getElementById("codeInput"), {
    lineNumbers: true,
    mode: "text/x-c++src",
    theme: "dracula",
    indentUnit: 4,
    matchBrackets: true
});

// 1. TYPOGRAPHY HELPER
const formatComplexity = (str) => {
    return str
        .replace(/\^(\d+)/g, '<sup>$1</sup>')
        .replace(/\^n/g, '<sup>n</sup>')
        .replace(/o\(/gi, 'O(');
};

// 2. OPTIMIZATION TIP HELPER
const getOptimizationTip = (complexity) => {
    const comp = complexity.toLowerCase();
    if (comp.includes('n^2')) return "💡 Tip: Can you use a HashMap or Two-Pointers to reduce this?";
    if (comp.includes('nlogn')) return "💡 Tip: Great efficiency! Sorting is usually the bottleneck here.";
    if (comp.includes('1')) return "💡 Tip: Perfect! This is O(1) constant time.";
    return "💡 Tip: Keep experimenting with data structures to optimize further.";
};

const generateGraphData = (complexity) => {
    const str = complexity.replace(/\s+/g, '').toLowerCase();
    if (str.includes('1')) return xValues.map(() => 1);
    if (str.includes('logn') && !str.includes('nlogn')) return xValues.map(x => Math.log2(x));
    if (str.includes('nlogn')) return xValues.map(x => x * Math.log2(x));
    if (str.includes('n^2') || str.includes('n*n')) return xValues.map(x => x * x);
    if (str.includes('n^3')) return xValues.map(x => Math.pow(x, 3));
    if (str.includes('2^n')) return xValues.map(x => Math.pow(2, x));
    return xValues.map(x => x);
};

const renderChart = (canvasId, existingChart, complexity) => {
    const ctx = document.getElementById(canvasId).getContext('2d');
    if (existingChart) existingChart.destroy();
    
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
                tooltip: { enabled: true, mode: 'index', intersect: false, callbacks: { label: (item) => `Ops: ${Math.round(item.raw)}` } } 
            },
            scales: { x: { display: true, title: { display: true, text: 'n', color: '#666' }, grid: { display: false } }, y: { display: true, title: { display: true, text: 'Ops', color: '#666' } } }
        }
    });
};

analyzeBtn.addEventListener('click', async () => {
    const code = editor.getValue();
    
    // ERROR FEEDBACK (SHAKE)
    if (!code.trim()) {
        analyzeBtn.classList.add('shake');
        setTimeout(() => analyzeBtn.classList.remove('shake'), 300);
        return;
    }

    analyzeBtn.disabled = true;
    btnSpinner.classList.remove('hidden');
    
    const messages = ["Analyzing logic...", "Computing complexity...", "Mapping curves..."];
    let msgIndex = 0;
    const msgInterval = setInterval(() => {
        btnText.innerText = messages[msgIndex % messages.length];
        msgIndex++;
    }, 1200);

    const resultBox = document.getElementById('resultBox');
    resultBox.classList.add('hidden');

    try {
        const response = await fetch('http://localhost:5000/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code })
        });
        
        const data = await response.json();
        if (data.error) throw new Error(data.error);

        clearInterval(msgInterval);
        btnSpinner.classList.add('hidden');
        btnText.innerText = "Analysis Complete";
        analyzeBtn.classList.add('success-btn', 'checkmark');

        // SUCCESS FEEDBACK (POP-IN)
        resultBox.classList.remove('hidden');
        resultBox.classList.add('pop-in');

        document.getElementById('timeResult').innerHTML = formatComplexity(data.time_complexity);
        document.getElementById('spaceResult').innerHTML = formatComplexity(data.space_complexity);
        document.getElementById('tipBox').innerText = getOptimizationTip(data.time_complexity);

        timeChart = renderChart('timeChart', timeChart, data.time_complexity);
        spaceChart = renderChart('spaceChart', spaceChart, data.space_complexity);

        setTimeout(() => {
            analyzeBtn.classList.remove('success-btn', 'checkmark');
            btnText.innerText = "Run Analysis";
            analyzeBtn.disabled = false;
        }, 2000);

    } catch (error) {
        clearInterval(msgInterval);
        btnSpinner.classList.add('hidden');
        btnText.innerText = "Error: See Console"; 
        console.error("DETAILED ERROR:", error); 
        alert("DEBUG: " + error.message);        
        analyzeBtn.disabled = false;
    }
});