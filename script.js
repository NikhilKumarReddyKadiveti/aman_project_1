/**
 * RESTO-AI PRO: PRODUCTION ENGINE
 * API Key: sk-proj-CUTV... (Updated 2026)
 */

// 1. YOUR NEW API KEY
const OPENAI_API_KEY = "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";

// 2. YOUR ACTIVE BACKEND
const BRIDGE_URL = "https://managment.lovestoblog.com/api_sales.php"; 

let salesData = [];
let salesChart = null;

window.onload = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const clientId = urlParams.get('client_id');

    // Default to the client ID seen in your screenshot if none provided
    const targetId = clientId || "51794"; 
    document.getElementById('display-id').innerText = targetId;
    fetchData(targetId);
};

async function fetchData(id) {
    const aiBox = document.getElementById('aiResponse');
    try {
        const response = await fetch(`${BRIDGE_URL}?client_id=${id}`, {
            method: 'GET',
            mode: 'cors'
        });

        // InfinityFree sometimes sends an HTML "Checking your browser" page. 
        // We check if we actually got the JSON data.
        const text = await response.text();
        try {
            const data = JSON.parse(text);
            if (data.length > 0) {
                salesData = data;
                updateDashboardUI();
            } else {
                aiBox.innerText = "No records found for Client: " + id;
            }
        } catch (jsonError) {
            // If parsing fails, we likely hit the security wall
            throw new Error("Security Wall Active");
        }
    } catch (err) {
        console.error("Connection error:", err);
        showBypassMessage(id);
    }
}

function showBypassMessage(id) {
    const aiBox = document.getElementById('aiResponse');
    aiBox.innerHTML = `
        <div style="background: rgba(0, 122, 255, 0.1); border: 1px solid #007AFF; padding: 15px; border-radius: 12px; text-align: center;">
            <p style="margin-bottom: 10px;">⚠️ <b>Connection Pending</b></p>
            <p style="font-size: 0.8rem; margin-bottom: 15px;">Click below to authorize the secure data tunnel from InfinityFree.</p>
            <a href="${BRIDGE_URL}?client_id=${id}" target="_blank" 
               style="background:#007AFF; color:white; padding:8px 16px; border-radius:8px; text-decoration:none; font-size:0.9rem;"
               onclick="setTimeout(()=>location.reload(), 3000)">
               Authorize & Sync Data
            </a>
        </div>`;
}

function updateDashboardUI() {
    // Column Mapping: order_date, total_amount (from your PHP/MySQL)
    const totalRev = salesData.reduce((sum, row) => sum + parseFloat(row.total_amount || 0), 0);
    const orderCount = salesData.length;
    const avgTicket = totalRev / orderCount;

    document.getElementById('total-revenue').innerText = `₹${totalRev.toLocaleString('en-IN')}`;
    document.getElementById('total-orders').innerText = orderCount;
    document.getElementById('avg-ticket').innerText = `₹${Math.round(avgTicket)}`;

    document.getElementById('aiResponse').innerText = "Database Connected. Click 'Analyze with AI' for a full report.";
    renderSalesChart();
}

function renderSalesChart() {
    const ctx = document.getElementById('salesChart').getContext('2d');
    const sorted = [...salesData].sort((a, b) => new Date(a.order_date) - new Date(b.order_date));
    
    if(salesChart) salesChart.destroy();
    salesChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: sorted.map(r => r.order_date.split(' ')[0]),
            datasets: [{
                label: 'Revenue',
                data: sorted.map(r => r.total_amount),
                borderColor: '#007AFF',
                backgroundColor: 'rgba(0, 122, 255, 0.05)',
                fill: true,
                tension: 0.4,
                pointRadius: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { ticks: { color: '#94a3b8' }, grid: { display: false } },
                y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } }
            }
        }
    });
}

async function generateAIInsights() {
    const aiBox = document.getElementById('aiResponse');
    if (salesData.length === 0) return;

    aiBox.innerHTML = "<em>Generating AI Business Strategy...</em>";

    // Send a sample of your 190 orders for AI context
    const dataSample = salesData.slice(0, 15).map(s => `Order: ₹${s.total_amount} on ${s.order_date}`).join(", ");

    try {
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: [
                    { role: "system", content: "You are an expert restaurant analyst. Analyze these orders and provide 3 short, actionable growth tips." },
                    { role: "user", content: `Here is the sales data: ${dataSample}` }
                ]
            })
        });

        const result = await res.json();
        aiBox.innerHTML = result.choices[0].message.content.replace(/\n/g, "<br>");
    } catch (err) {
        aiBox.innerText = "The AI Analyst is busy. Please try again in a moment.";
    }
}
