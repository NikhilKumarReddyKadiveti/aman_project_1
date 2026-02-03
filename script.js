const OPENAI_API_KEY = "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";

// YOUR REAL DOMAIN
const BRIDGE_URL = "https://managment.lovestoblog.com/api_sales.php"; 

let salesData = [];
let salesChart = null;

window.onload = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const clientId = urlParams.get('client_id');

    if (clientId) {
        document.getElementById('display-id').innerText = clientId;
        fetchData(clientId);
    } else {
        document.getElementById('display-id').innerText = "Visit with ?client_id=51794";
    }
};

async function fetchData(id) {
    const aiBox = document.getElementById('aiResponse');
    try {
        // We add a 'no-cache' flag to prevent old data issues
        const response = await fetch(`${BRIDGE_URL}?client_id=${id}`, {
            method: 'GET',
            mode: 'cors'
        });
        
        const data = await response.json();
        
        if (data.length > 0) {
            salesData = data;
            updateUI();
        } else {
            aiBox.innerText = "No data found for this Client ID.";
        }
    } catch (err) {
        console.error("Connection Error:", err);
        aiBox.innerHTML = `
            <div style="color:#ff6b6b; padding:10px; border:1px solid #ff6b6b; border-radius:10px;">
                <b>Connection Blocked!</b><br>
                InfinityFree has a security system that blocks outside requests.<br><br>
                <a href="${BRIDGE_URL}?client_id=${id}" target="_blank" style="color:white; font-weight:bold;">
                   CLICK HERE TO AUTHORIZE ACCESS
                </a>
                <br>Then refresh this page.
            </div>`;
    }
}

function updateUI() {
    const total = salesData.reduce((s, r) => s + parseFloat(r.total_amount || 0), 0);
    document.getElementById('total-revenue').innerText = `₹${total.toLocaleString('en-IN')}`;
    document.getElementById('total-orders').innerText = salesData.length;
    document.getElementById('avg-ticket').innerText = `₹${Math.round(total / salesData.length)}`;
    renderChart();
}

function renderChart() {
    const ctx = document.getElementById('salesChart').getContext('2d');
    const sorted = [...salesData].sort((a,b) => new Date(a.order_date) - new Date(b.order_date));
    
    if(salesChart) salesChart.destroy();
    salesChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: sorted.map(r => r.order_date.split(' ')[0]),
            datasets: [{
                label: 'Revenue',
                data: sorted.map(r => r.total_amount),
                borderColor: '#007AFF',
                fill: true,
                backgroundColor: 'rgba(0, 122, 255, 0.1)',
                tension: 0.4
            }]
        },
        options: { maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });
}

async function generateAIInsights() {
    const box = document.getElementById('aiResponse');
    box.innerText = "Analyzing restaurant performance...";
    
    const summary = salesData.slice(0, 10).map(s => `Order: ₹${s.total_amount}`).join(", ");

    try {
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: [{role: "user", content: `Give me 3 business tips for my restaurant based on these sales: ${summary}`}]
            })
        });
        const json = await res.json();
        box.innerText = json.choices[0].message.content;
    } catch (e) {
        box.innerText = "AI Analysis failed. Check key limits.";
    }
}
