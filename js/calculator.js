/**
 * Receipt Rewards Calculator
 * Calculates potential earnings based on receipt scanning habits
 * Compares Crinkl, Fetch Rewards, and ReceiptPal
 */

// Current app being displayed
let currentApp = 'crinkl';

// All available apps for comparison
const APP_LIST = ['crinkl', 'fetch', 'receiptpal'];

// Constants - Crinkl Points System
const CRINKL_CONFIG = {
    name: 'Crinkl',
    BASE_POINTS_PER_RECEIPT: 100,
    STREAK_POINTS_PER_DAY: 10,
    STREAK_BONUS_CAP: 500,
    WEEKLY_BONUS_THRESHOLD: 10,
    WEEKLY_BONUS_POINTS: 500,
    REFERRAL_POINTS: 500,
    POINTS_TO_USD: 0.001, // 100 points = $0.10
    CATEGORY_MULTIPLIERS: {
        mixed: 1.75,
        groceries: 3,
        restaurants: 3,
        coffee: 2,
        apparel: 1.5,
        standard: 1
    },
    HOLDINGS_TIERS: [
        { max: 1000, multiplier: 1 },
        { max: 5000, multiplier: 1.25 },
        { max: 10000, multiplier: 1.5 },
        { max: Infinity, multiplier: 2 }
    ],
    HAS_STREAKS: true,
    HAS_WEEKLY_BONUS: true,
    HAS_CATEGORIES: true,
    HAS_HOLDINGS: true,
    MAX_RECEIPTS_PER_DAY: 10,
    MAX_RECEIPTS_PER_WEEK: 70,
    accentColor: '#F59E0B'
};

// Constants - Fetch Rewards System
const FETCH_CONFIG = {
    name: 'Fetch Rewards',
    BASE_POINTS_PER_RECEIPT: 25,
    REFERRAL_POINTS: 1000,
    POINTS_TO_USD: 0.001, // 1000 points = $1
    MAX_RECEIPTS_PER_WEEK: 35,
    HAS_STREAKS: false,
    HAS_WEEKLY_BONUS: false,
    HAS_CATEGORIES: false,
    HAS_HOLDINGS: false,
    accentColor: '#FF6B35'
};

// Constants - ReceiptPal System
const RECEIPTPAL_CONFIG = {
    name: 'ReceiptPal',
    // 4 receipts = 1 card = 100 points, so 25 points per receipt
    POINTS_PER_RECEIPT: 25,
    // 2200 points = $5, so 1 point = $0.00227
    POINTS_TO_USD: 0.00227,
    // ~$0.06 per receipt
    USD_PER_RECEIPT: 0.057,
    // Max 300 points per week = 12 receipts worth counting
    MAX_POINTS_PER_WEEK: 300,
    MAX_RECEIPTS_PER_WEEK: 12,
    REFERRAL_POINTS: 250,
    HAS_STREAKS: false,
    HAS_WEEKLY_BONUS: false,
    HAS_CATEGORIES: false,
    HAS_HOLDINGS: false,
    accentColor: '#4CAF50'
};

// DOM Elements
const elements = {
    // App toggle buttons
    crinklToggle: document.getElementById('crinkl-toggle'),
    fetchToggle: document.getElementById('fetch-toggle'),
    receiptpalToggle: document.getElementById('receiptpal-toggle'),

    // Sliders
    yearsSlider: document.getElementById('years-slider'),
    receiptsSlider: document.getElementById('receipts-slider'),
    referralsSlider: document.getElementById('referrals-slider'),
    streakSlider: document.getElementById('streak-slider'),

    // Other inputs
    categorySelect: document.getElementById('category-select'),
    holdingsInput: document.getElementById('holdings-input'),

    // Value displays
    yearsValue: document.getElementById('years-value'),
    receiptsValue: document.getElementById('receipts-value'),
    referralsValue: document.getElementById('referrals-value'),
    streakValue: document.getElementById('streak-value'),
    holdingsValue: document.getElementById('holdings-value'),

    // Results
    totalValue: document.getElementById('total-value'),
    totalPoints: document.getElementById('total-points'),
    appName: document.getElementById('app-name'),

    // Breakdown
    receiptsDetail: document.getElementById('receipts-detail'),
    receiptsPoints: document.getElementById('receipts-points'),
    streakDetail: document.getElementById('streak-detail'),
    streakPoints: document.getElementById('streak-points'),
    weeklyDetail: document.getElementById('weekly-detail'),
    weeklyPoints: document.getElementById('weekly-points'),
    referralDetail: document.getElementById('referral-detail'),
    referralPoints: document.getElementById('referral-points'),
    multiplierDetail: document.getElementById('multiplier-detail'),
    multiplierValue: document.getElementById('multiplier-value'),

    // Breakdown items (for hiding/showing)
    streakItem: document.getElementById('streak-item'),
    weeklyItem: document.getElementById('weekly-item'),
    multiplierItem: document.getElementById('multiplier-item'),
    categoryGroup: document.getElementById('category-group'),
    holdingsGroup: document.getElementById('holdings-group'),
    streakGroup: document.getElementById('streak-group'),

    // Projections
    monthlyValue: document.getElementById('monthly-value'),
    yearlyValue: document.getElementById('yearly-value'),

    // Tier buttons
    tierButtons: document.querySelectorAll('.tier-btn'),

    // Comparison elements
    compareValue: document.getElementById('compare-value'),
    compareName: document.getElementById('compare-name'),
    differenceValue: document.getElementById('difference-value'),
    differenceLabel: document.getElementById('difference-label'),

    // Results panel
    resultsPanel: document.getElementById('results-panel')
};

/**
 * Get holdings multiplier based on amount held (Crinkl only)
 */
function getHoldingsMultiplier(holdings) {
    for (const tier of CRINKL_CONFIG.HOLDINGS_TIERS) {
        if (holdings <= tier.max) {
            return tier.multiplier;
        }
    }
    return CRINKL_CONFIG.HOLDINGS_TIERS[CRINKL_CONFIG.HOLDINGS_TIERS.length - 1].multiplier;
}

/**
 * Get holdings tier description
 */
function getHoldingsTierDescription(holdings) {
    if (holdings <= 1000) return 'Base rate';
    if (holdings <= 5000) return '1,001 - 5,000 tier';
    if (holdings <= 10000) return '5,001 - 10,000 tier';
    return '10,001+ tier';
}

/**
 * Calculate Crinkl earnings
 */
function calculateCrinklEarnings() {
    const years = parseInt(elements.yearsSlider.value);
    const receiptsPerDay = parseInt(elements.receiptsSlider.value);
    const category = elements.categorySelect.value;
    const holdings = parseInt(elements.holdingsInput.value) || 0;
    const referrals = parseInt(elements.referralsSlider.value);
    const streakConsistency = parseInt(elements.streakSlider.value) / 100;

    const totalDays = years * 365;
    const totalWeeks = years * 52;

    // Crinkl has a daily limit of 10 receipts (70/week)
    const effectiveReceiptsPerDay = Math.min(receiptsPerDay, CRINKL_CONFIG.MAX_RECEIPTS_PER_DAY);
    const totalReceipts = totalDays * effectiveReceiptsPerDay;

    // Receipt points with category multiplier
    const categoryMultiplier = CRINKL_CONFIG.CATEGORY_MULTIPLIERS[category];
    const receiptsPoints = totalReceipts * CRINKL_CONFIG.BASE_POINTS_PER_RECEIPT * categoryMultiplier;

    // Streak points
    const effectiveStreakDays = Math.floor(totalDays * streakConsistency);
    let streakPoints = 0;

    if (streakConsistency === 0) {
        streakPoints = 0;
    } else if (streakConsistency >= 0.95) {
        const streaksPerYear = Math.ceil(365 / 50);
        const totalStreakCycles = streaksPerYear * years;
        streakPoints = totalStreakCycles * CRINKL_CONFIG.STREAK_BONUS_CAP;
    } else {
        const avgDaysBetweenBreaks = Math.max(1, Math.floor(1 / (1 - streakConsistency)));
        const avgStreakLength = Math.min(50, avgDaysBetweenBreaks);
        const numberOfStreakCycles = Math.floor(effectiveStreakDays / avgStreakLength);
        const pointsPerCycle = Math.min(avgStreakLength * CRINKL_CONFIG.STREAK_POINTS_PER_DAY, CRINKL_CONFIG.STREAK_BONUS_CAP);
        streakPoints = numberOfStreakCycles * pointsPerCycle;
        const remainingDays = effectiveStreakDays % avgStreakLength;
        streakPoints += Math.min(remainingDays * CRINKL_CONFIG.STREAK_POINTS_PER_DAY, CRINKL_CONFIG.STREAK_BONUS_CAP);
    }

    // Weekly bonus
    const receiptsPerWeek = receiptsPerDay * 7;
    const weeksQualified = receiptsPerWeek >= CRINKL_CONFIG.WEEKLY_BONUS_THRESHOLD ? totalWeeks : 0;
    const weeklyPoints = weeksQualified * CRINKL_CONFIG.WEEKLY_BONUS_POINTS;

    // Referral points
    const referralPoints = referrals * CRINKL_CONFIG.REFERRAL_POINTS;

    // Apply holdings multiplier
    const subtotal = receiptsPoints + streakPoints + weeklyPoints + referralPoints;
    const holdingsMultiplier = getHoldingsMultiplier(holdings);
    const totalPoints = Math.floor(subtotal * holdingsMultiplier);

    const totalUSD = totalPoints * CRINKL_CONFIG.POINTS_TO_USD;

    return {
        totalPoints,
        totalUSD,
        monthlyUSD: totalUSD / (years * 12),
        yearlyUSD: totalUSD / years,
        totalReceipts,
        receiptsPoints: Math.floor(receiptsPoints * holdingsMultiplier),
        effectiveStreakDays,
        streakPoints: Math.floor(streakPoints * holdingsMultiplier),
        weeksQualified,
        weeklyPoints: Math.floor(weeklyPoints * holdingsMultiplier),
        referrals,
        referralPoints: Math.floor(referralPoints * holdingsMultiplier),
        holdingsMultiplier,
        holdingsTierDescription: getHoldingsTierDescription(holdings)
    };
}

/**
 * Calculate Fetch Rewards earnings
 */
function calculateFetchEarnings() {
    const years = parseInt(elements.yearsSlider.value);
    const receiptsPerDay = parseInt(elements.receiptsSlider.value);
    const referrals = parseInt(elements.referralsSlider.value);

    const totalWeeks = years * 52;

    // Fetch has a 35 receipts per week limit
    const receiptsPerWeek = Math.min(receiptsPerDay * 7, FETCH_CONFIG.MAX_RECEIPTS_PER_WEEK);
    const totalReceipts = receiptsPerWeek * totalWeeks;

    // Base 25 points per receipt
    const receiptsPoints = totalReceipts * FETCH_CONFIG.BASE_POINTS_PER_RECEIPT;

    // Referral bonus
    const referralPoints = referrals * FETCH_CONFIG.REFERRAL_POINTS;

    const totalPoints = receiptsPoints + referralPoints;
    const totalUSD = totalPoints * FETCH_CONFIG.POINTS_TO_USD;

    return {
        totalPoints,
        totalUSD,
        monthlyUSD: totalUSD / (years * 12),
        yearlyUSD: totalUSD / years,
        totalReceipts,
        receiptsPoints,
        receiptsUSD: receiptsPoints * FETCH_CONFIG.POINTS_TO_USD,
        effectiveStreakDays: 0,
        streakPoints: 0,
        weeksQualified: 0,
        weeklyPoints: 0,
        referrals,
        referralPoints,
        referralUSD: referralPoints * FETCH_CONFIG.POINTS_TO_USD,
        holdingsMultiplier: 1,
        holdingsTierDescription: 'N/A',
        limitedReceipts: receiptsPerDay * 7 > FETCH_CONFIG.MAX_RECEIPTS_PER_WEEK
    };
}

/**
 * Calculate ReceiptPal earnings
 */
function calculateReceiptPalEarnings() {
    const years = parseInt(elements.yearsSlider.value);
    const receiptsPerDay = parseInt(elements.receiptsSlider.value);
    const referrals = parseInt(elements.referralsSlider.value);

    const totalWeeks = years * 52;

    // ReceiptPal has a 12 receipts per week limit (300 points max)
    const receiptsPerWeek = Math.min(receiptsPerDay * 7, RECEIPTPAL_CONFIG.MAX_RECEIPTS_PER_WEEK);
    const totalReceipts = receiptsPerWeek * totalWeeks;

    // 25 points per receipt
    const receiptsPoints = totalReceipts * RECEIPTPAL_CONFIG.POINTS_PER_RECEIPT;
    const receiptsUSD = receiptsPoints * RECEIPTPAL_CONFIG.POINTS_TO_USD;

    // Referral bonus
    const referralPoints = referrals * RECEIPTPAL_CONFIG.REFERRAL_POINTS;
    const referralUSD = referralPoints * RECEIPTPAL_CONFIG.POINTS_TO_USD;

    const totalPoints = receiptsPoints + referralPoints;
    const totalUSD = totalPoints * RECEIPTPAL_CONFIG.POINTS_TO_USD;

    return {
        totalPoints,
        totalUSD,
        monthlyUSD: totalUSD / (years * 12),
        yearlyUSD: totalUSD / years,
        totalReceipts,
        receiptsPoints,
        receiptsUSD,
        effectiveStreakDays: 0,
        streakPoints: 0,
        weeksQualified: 0,
        weeklyPoints: 0,
        referrals,
        referralPoints,
        referralUSD,
        holdingsMultiplier: 1,
        holdingsTierDescription: 'N/A',
        limitedReceipts: receiptsPerDay * 7 > RECEIPTPAL_CONFIG.MAX_RECEIPTS_PER_WEEK
    };
}

/**
 * Get earnings for a specific app
 */
function getEarningsForApp(appName) {
    switch(appName) {
        case 'crinkl': return calculateCrinklEarnings();
        case 'fetch': return calculateFetchEarnings();
        case 'receiptpal': return calculateReceiptPalEarnings();
        default: return calculateCrinklEarnings();
    }
}

/**
 * Get config for a specific app
 */
function getConfigForApp(appName) {
    switch(appName) {
        case 'crinkl': return CRINKL_CONFIG;
        case 'fetch': return FETCH_CONFIG;
        case 'receiptpal': return RECEIPTPAL_CONFIG;
        default: return CRINKL_CONFIG;
    }
}

/**
 * Format number with commas
 */
function formatNumber(num) {
    return num.toLocaleString('en-US');
}

/**
 * Format currency
 */
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}

/**
 * Switch between app views (Crinkl, Fetch, ReceiptPal)
 */
function switchApp(app) {
    currentApp = app;
    const config = getConfigForApp(app);

    // Update toggle buttons - remove active from all, add to current
    const toggleButtons = [
        elements.crinklToggle,
        elements.fetchToggle,
        elements.receiptpalToggle
    ];

    toggleButtons.forEach(btn => {
        if (btn) btn.classList.remove('active');
    });

    // Add active class to current app's button
    switch(app) {
        case 'crinkl': elements.crinklToggle?.classList.add('active'); break;
        case 'fetch': elements.fetchToggle?.classList.add('active'); break;
        case 'receiptpal': elements.receiptpalToggle?.classList.add('active'); break;
    }

    // Update results panel class for styling
    elements.resultsPanel.classList.remove('crinkl-mode', 'fetch-mode', 'receiptpal-mode');
    elements.resultsPanel.classList.add(`${app}-mode`);

    // Show/hide Crinkl-specific inputs (streaks, holdings)
    if (elements.holdingsGroup) {
        elements.holdingsGroup.style.display = app === 'crinkl' ? 'block' : 'none';
    }
    if (elements.streakGroup) {
        elements.streakGroup.style.display = app === 'crinkl' ? 'block' : 'none';
    }

    // Categories are used by Crinkl only
    if (elements.categoryGroup) {
        elements.categoryGroup.style.display = app === 'crinkl' ? 'block' : 'none';
    }

    // Show/hide Crinkl-specific breakdown items
    if (elements.streakItem) {
        elements.streakItem.style.display = app === 'crinkl' ? 'flex' : 'none';
    }
    if (elements.weeklyItem) {
        elements.weeklyItem.style.display = app === 'crinkl' ? 'flex' : 'none';
    }
    if (elements.multiplierItem) {
        elements.multiplierItem.style.display = app === 'crinkl' ? 'flex' : 'none';
    }

    // Hide the multiplier divider for non-Crinkl apps
    const multiplierDivider = document.getElementById('multiplier-divider');
    if (multiplierDivider) {
        multiplierDivider.style.display = app === 'crinkl' ? 'block' : 'none';
    }

    // Update UI
    updateUI();
}

/**
 * Update the UI with calculated values
 */
function updateUI() {
    // Calculate all app earnings
    const allResults = {
        crinkl: calculateCrinklEarnings(),
        fetch: calculateFetchEarnings(),
        receiptpal: calculateReceiptPalEarnings()
    };

    // Get current app results
    const results = allResults[currentApp];
    const config = getConfigForApp(currentApp);

    // Update app name in results
    if (elements.appName) {
        elements.appName.textContent = config.name;
    }

    // Update main results
    elements.totalValue.textContent = formatCurrency(results.totalUSD);

    // Show points or cash depending on app
    if (results.usesDirectCash) {
        elements.totalPoints.textContent = 'Direct Cash Back';
    } else {
        elements.totalPoints.textContent = `${formatNumber(results.totalPoints)} Points`;
    }

    // Update breakdown
    elements.receiptsDetail.textContent = `${formatNumber(results.totalReceipts)} receipts`;

    // Show points or USD for receipt earnings based on app
    if (results.usesDirectCash) {
        elements.receiptsPoints.textContent = formatCurrency(results.receiptsUSD);
    } else {
        elements.receiptsPoints.textContent = formatNumber(results.receiptsPoints);
    }

    if (currentApp === 'crinkl') {
        elements.streakDetail.textContent = `${formatNumber(results.effectiveStreakDays)} days`;
        elements.streakPoints.textContent = formatNumber(results.streakPoints);

        elements.weeklyDetail.textContent = `${formatNumber(results.weeksQualified)} weeks`;
        elements.weeklyPoints.textContent = formatNumber(results.weeklyPoints);

        elements.multiplierDetail.textContent = results.holdingsTierDescription;
        elements.multiplierValue.textContent = `${results.holdingsMultiplier}×`;
    }

    elements.referralDetail.textContent = `${results.referrals} friends`;
    if (results.usesDirectCash) {
        elements.referralPoints.textContent = formatCurrency(results.referralUSD);
    } else {
        elements.referralPoints.textContent = formatNumber(results.referralPoints);
    }

    // Update projections
    elements.monthlyValue.textContent = formatCurrency(results.monthlyUSD);
    elements.yearlyValue.textContent = formatCurrency(results.yearlyUSD);

    // Find the best comparison (highest earning other app)
    const otherApps = APP_LIST.filter(app => app !== currentApp);
    let bestCompareApp = otherApps[0];
    let bestCompareValue = allResults[otherApps[0]].totalUSD;

    otherApps.forEach(app => {
        if (allResults[app].totalUSD > bestCompareValue) {
            bestCompareValue = allResults[app].totalUSD;
            bestCompareApp = app;
        }
    });

    const compareResults = allResults[bestCompareApp];
    const compareName = getConfigForApp(bestCompareApp).name;

    // Update comparison box
    if (elements.compareValue) {
        elements.compareValue.textContent = formatCurrency(compareResults.totalUSD);
    }
    if (elements.compareName) {
        elements.compareName.textContent = compareName;
    }

    // Calculate and show difference
    const difference = results.totalUSD - compareResults.totalUSD;
    if (elements.differenceValue) {
        if (difference >= 0) {
            elements.differenceValue.textContent = `+${formatCurrency(difference)}`;
            elements.differenceValue.className = 'difference-value positive';
            if (elements.differenceLabel) {
                elements.differenceLabel.textContent = `more than ${compareName}`;
            }
        } else {
            elements.differenceValue.textContent = formatCurrency(difference);
            elements.differenceValue.className = 'difference-value negative';
            if (elements.differenceLabel) {
                elements.differenceLabel.textContent = `less than ${compareName}`;
            }
        }
    }

    // Update the comparison summary with all apps
    updateComparisonSummary(allResults);
}

/**
 * Update the comparison summary showing all app earnings
 */
function updateComparisonSummary(allResults) {
    const summaryContainer = document.getElementById('comparison-summary');
    if (!summaryContainer) return;

    // Sort apps by earnings (highest first)
    const sortedApps = APP_LIST.map(app => ({
        app,
        name: getConfigForApp(app).name,
        earnings: allResults[app].totalUSD,
        color: getConfigForApp(app).accentColor
    })).sort((a, b) => b.earnings - a.earnings);

    // Generate HTML for comparison
    summaryContainer.innerHTML = sortedApps.map((item, index) => `
        <div class="comparison-row ${item.app === currentApp ? 'active' : ''}" data-app="${item.app}">
            <span class="rank">#${index + 1}</span>
            <span class="app-name" style="color: ${item.color}">${item.name}</span>
            <span class="app-earnings">${formatCurrency(item.earnings)}</span>
        </div>
    `).join('');
}

/**
 * Update displayed values for inputs
 */
function updateInputDisplays() {
    const years = parseInt(elements.yearsSlider.value);
    elements.yearsValue.textContent = years === 1 ? '1 Year' : `${years} Years`;

    elements.receiptsValue.textContent = elements.receiptsSlider.value;
    elements.referralsValue.textContent = elements.referralsSlider.value;
    elements.streakValue.textContent = `${elements.streakSlider.value}%`;
    elements.holdingsValue.textContent = formatNumber(parseInt(elements.holdingsInput.value) || 0);

    // Update tier button states
    const holdings = parseInt(elements.holdingsInput.value) || 0;
    elements.tierButtons.forEach(btn => {
        const amount = parseInt(btn.dataset.amount);
        btn.classList.toggle('active',
            (amount === 0 && holdings <= 1000) ||
            (amount === 1000 && holdings > 1000 && holdings <= 5000) ||
            (amount === 5000 && holdings > 5000 && holdings <= 10000) ||
            (amount === 10000 && holdings > 10000)
        );
    });
}

/**
 * Handle slider input with visual feedback
 */
function handleSliderInput(slider) {
    const min = parseInt(slider.min);
    const max = parseInt(slider.max);
    const value = parseInt(slider.value);
    const percentage = ((value - min) / (max - min)) * 100;

    // Update slider track fill based on current app
    const config = getConfigForApp(currentApp);
    const fillColor = config.accentColor;
    slider.style.background = `linear-gradient(to right, ${fillColor} 0%, ${fillColor} ${percentage}%, #262626 ${percentage}%, #262626 100%)`;
}

/**
 * Update all slider appearances
 */
function updateAllSliders() {
    const sliders = [
        elements.yearsSlider,
        elements.receiptsSlider,
        elements.referralsSlider,
        elements.streakSlider
    ];

    sliders.forEach(slider => {
        if (slider) handleSliderInput(slider);
    });
}

/**
 * Initialize all event listeners
 */
function initEventListeners() {
    // App toggle buttons
    if (elements.crinklToggle) {
        elements.crinklToggle.addEventListener('click', () => {
            switchApp('crinkl');
            updateAllSliders();
        });
    }

    if (elements.fetchToggle) {
        elements.fetchToggle.addEventListener('click', () => {
            switchApp('fetch');
            updateAllSliders();
        });
    }

    if (elements.receiptpalToggle) {
        elements.receiptpalToggle.addEventListener('click', () => {
            switchApp('receiptpal');
            updateAllSliders();
        });
    }

    // Slider inputs
    const sliders = [
        elements.yearsSlider,
        elements.receiptsSlider,
        elements.referralsSlider,
        elements.streakSlider
    ];

    sliders.forEach(slider => {
        if (slider) {
            slider.addEventListener('input', () => {
                handleSliderInput(slider);
                updateInputDisplays();
                updateUI();
            });

            // Initialize slider appearance
            handleSliderInput(slider);
        }
    });

    // Category select
    if (elements.categorySelect) {
        elements.categorySelect.addEventListener('change', updateUI);
    }

    // Holdings input
    if (elements.holdingsInput) {
        elements.holdingsInput.addEventListener('input', () => {
            updateInputDisplays();
            updateUI();
        });
    }

    // Tier buttons
    elements.tierButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const amount = parseInt(btn.dataset.amount);
            let value;
            switch(amount) {
                case 0: value = 0; break;
                case 1000: value = 1001; break;
                case 5000: value = 5001; break;
                case 10000: value = 10001; break;
                default: value = amount;
            }
            elements.holdingsInput.value = value;
            updateInputDisplays();
            updateUI();
        });
    });
}

/**
 * Set the current year in the footer
 */
function setCurrentYear() {
    const yearElement = document.getElementById('current-year');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }
}

/**
 * Initialize the calculator
 */
function init() {
    initEventListeners();
    updateInputDisplays();
    switchApp('crinkl'); // Start with Crinkl
    setCurrentYear();
}

// Start the application
document.addEventListener('DOMContentLoaded', init);
