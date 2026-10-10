// static/js/main.js

// Shared utilities for AgriPulse Rwanda

async function fetchDistricts() {
    const res = await fetch('/api/districts');
    return await res.json();
}

async function populateDistrictSelect(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return;
    const districts = await fetchDistricts();
    districts.forEach(d => {
        const opt = document.createElement('option');
        opt.value = d;
        opt.textContent = d;
        select.appendChild(opt);
    });
}

function formatRWF(value) {
    return new Intl.NumberFormat('en-RW').format(Math.round(value)) + ' RWF';
}

function showAlert(message, type = 'success') {
    const container = document.getElementById('alertContainer');
    if (!container) {
        alert(message);
        return;
    }
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.innerHTML = `${message}<button type="button" class="btn-close" data-bs-dismiss="alert"></button>`;
    container.appendChild(alert);
    setTimeout(() => alert.remove(), 5000);
}

// Auto-populate any district select on page load
document.addEventListener('DOMContentLoaded', () => {
    const districtSelects = document.querySelectorAll('select[data-districts="true"]');
    districtSelects.forEach(sel => populateDistrictSelect(sel.id));
});