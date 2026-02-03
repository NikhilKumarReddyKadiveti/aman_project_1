/** * RESTO-AI PRO: CORE LOGIC 
 * Integrated with OpenAI GPT-4o-mini
 */

// 1. CONFIGURATION
const OPENAI_API_KEY = "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";

// 2. UPDATE THIS TO YOUR ACTUAL INFINITYFREE URL
const BRIDGE_URL = "https://YOUR-SUBDOMAIN.infinityfreeapp.com/api_sales.php"; 

let salesData = [];
let salesChart = null;

window.onload = async () => {
    // Automatically picks up client_id from browser URL: site.io/?client_id=51794
    const urlParams = new URLSearchParams(window.location.search);
    const clientId = urlParams.get('client_id');

    if (clientId) {
        document.getElementById('display-id').innerText = clientId;
        fetchData(clientId);
    } else {
        document.getElementById('display-id').innerText = "NO-CLIENT-ID";
        console.warn("Usage: your-site.github.io/?client_id=51794");
    }
};

async function fetchData(id) {
    const aiBox = document.getElementById('aiResponse');
    try {
        const response = await fetch(`${BRIDGE_URL}?client_id=${id}`);
        
        // Error handling for Connection/CORS
        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
        
        const data = await response.json();
        
        if (data.error) {
            aiBox.innerText = "Database Error: " + data.error;
            return;
        }

        salesData = data;
        if(salesData.length > 0) {
            updateDashboard();
        } else {
            aiBox.innerText = "No records found in the 'orders' table for this ID.";
        }
    } catch (err) {
        console.error("Fetch failed:", err);
        aiBox.innerHTML = `<span style="color:#ff4d4d">Connection Failed!</span><br>Make sure your InfinityFree PHP script has <b>CORS enabled</b> and is outputting valid JSON.`;
    }
}

function updateDashboard() {
    // KPI Calculations using columns from your database photo
    const totalRev = salesData.reduce((sum, row) => sum + parseFloat(row.total_amount || 0), 0);
    const orderCount = salesData.length;
    const avgOrder = orderCount > 0 ? totalRev / orderCount : 0;

    document.getElementById('total-revenue').innerText = `₹${totalRev.toLocaleString('en-IN')}`;
    document.getElementById('total-orders').innerText = orderCount;
    document.getElementById('avg-ticket').innerText = `₹${Math.round(avgOrder)}`;

    renderChart();
}

function renderChart() {
    const ctx = document.getElementById('salesChart').getContext('2d');
    
    // Grouping totals by date for 190+ records
    const chartData = [...salesData].sort((a, b) => new Date(a.order_date) - new Date(b.order_date));
    
    if (salesChart) salesChart.destroy();

    salesChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartData.map(r => r.order_date.split(' ')[0]),
            datasets: [{
                label: 'Revenue Trend',
                data: chartData.map(r => r.total_amount),
                borderColor: '#007AFF',
                backgroundColor: 'rgba(0, 122, 255, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true } }
        }
    });
}

async function generateAIInsights() {
    const aiBox = document.getElementById('aiResponse');
    if (salesData.length === 0) return;

    aiBox.innerHTML = `<div class="loader"></div> Analyzing business patterns...`;

    // Sending a data summary to OpenAI
    const summary = salesData.slice(0, 20).map(s => `Order ₹${s.total_amount} (${s.order_date})`).join(", ");

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
                    { role: "system", content: "You are a professional restaurant business analyst for the Indian market." },
                    { role: "user", content: `Analyze these recent orders and give me 3 growth suggestions in short bullet points: ${summary}` }
                ]
            })
        });

        const result = await res.json();
        aiBox.innerHTML = result.choices[0].message.content.replace(/\n/g, "<br>");
    } catch (err) {
        aiBox.innerText = "AI Analyst is busy. Check API key status.";
    }
}
