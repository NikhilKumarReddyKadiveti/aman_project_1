// 1. YOUR LATEST API KEY
const OPENAI_API_KEY = "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";
const BRIDGE_URL = "https://managment.lovestoblog.com/api_sales.php"; 

let salesData = [];
let salesChart = null;

window.onload = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const clientId = urlParams.get('client_id') || "51794";
    document.getElementById('display-id').innerText = clientId;
    fetchData(clientId);
};

async function fetchData(id) {
    try {
        const response = await fetch(`${BRIDGE_URL}?client_id=${id}`);
        const data = await response.json();
        
        if (data && data.length > 0) {
            salesData = data;
            processDashboard();
        } else {
            showError("No data found for this ID.");
        }
    } catch (err) {
        showError("Security Blocked. Click 'Authorize' below.");
    }
}

function processDashboard() {
    // Calculating from your real JSON keys: total_amount
    const totalRev = salesData.reduce((sum, row) => sum + parseFloat(row.total_amount || 0), 0);
    const orderCount = salesData.length;
    const avgVal = totalRev / orderCount;

    document.getElementById('total-revenue').innerText = `₹${totalRev.toLocaleString('en-IN')}`;
    document.getElementById('total-orders').innerText = orderCount;
    document.getElementById('avg-ticket').innerText = `₹${Math.round(avgVal)}`;

    renderGraph();
}

function renderGraph() {
    const ctx = document.getElementById('salesChart').getContext('2d');
    const sorted = [...salesData].sort((a,b) => new Date(a.order_date) - new Date(b.order_date));
    
    if(salesChart) salesChart.destroy();
    salesChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: sorted.map(r => r.order_date.split(' ')[0]),
            datasets: [{
                label: 'Daily Sales',
                data: sorted.map(r => r.total_amount),
                borderColor: '#007AFF',
                backgroundColor: 'rgba(0, 122, 255, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

async function generateAIInsights() {
    const aiBox = document.getElementById('aiResponse');
    aiBox.innerText = "Analyzing your 190 orders...";
    
    // Using the real data you provided for AI analysis
    const sample = salesData.slice(0, 10).map(s => `₹${s.total_amount}`).join(", ");

    try {
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: [{role: "user", content: `My restaurant made these sales: ${sample}. Give me 3 growth tips.`}]
            })
        });
        const result = await res.json();
        aiBox.innerText = result.choices[0].message.content;
    } catch (e) {
        aiBox.innerText = "AI failed to connect. Check your API key limits.";
    }
}

function showError(msg) {
    document.getElementById('aiResponse').innerHTML = `
        <div style="color:#ff4d4d; border:1px solid #ff4d4d; padding:10px; border-radius:8px;">
            ${msg}<br><br>
            <a href="${BRIDGE_URL}?client_id=51794" target="_blank" style="color:white; font-weight:bold;">[ CLICK HERE TO AUTHORIZE ]</a>
        </div>`;
}
