// Activity schedule with start/end times (24-hour format, Central Time)
const activities = [
    { name: 'Math',    startHour: 8,  startMin: 0,  endHour: 9,  endMin: 0 },
    { name: 'Arts',    startHour: 9,  startMin: 0,  endHour: 10, endMin: 0 },
    { name: 'Lunch',   startHour: 10, startMin: 0,  endHour: 11, endMin: 0 },
    { name: 'Science', startHour: 11, startMin: 0,  endHour: 12, endMin: 0 },
];

// Returns { hours, minutes, seconds } for the current time in Central Time
function getCentralTimeParts() {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Chicago',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: false,
    }).formatToParts(new Date());
    const get = (type) => {
        const part = parts.find((p) => p.type === type);
        const value = parseInt(part ? part.value : '0', 10);
        // hour12: false uses 24 for midnight in some environments; normalize to 0
        return type === 'hour' && value === 24 ? 0 : value;
    };
    return { hours: get('hour'), minutes: get('minute'), seconds: get('second') };
}

// Format time parts as "h:MM:SS AM/PM"
function formatTime({ hours, minutes, seconds }) {
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours % 12 || 12;
    return `${displayHour}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')} ${ampm}`;
}

// Format seconds into MM:SS
function formatCountdown(totalSeconds) {
    const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
    const seconds = String(totalSeconds % 60).padStart(2, '0');
    return `${minutes}:${seconds}`;
}

// Get all schedule card elements in DOM order (Math, Arts, Lunch, Science)
function getCardElements() {
    return document.querySelectorAll('.schedule-card');
}

function update() {
    const { hours, minutes, seconds } = getCentralTimeParts();
    const currentTotalMinutes = hours * 60 + minutes;

    const timeDisplay = document.getElementById('time-display');
    const currentActivityBox = document.querySelector('.current-activity-box');
    const cards = getCardElements();

    // Update the clock display
    timeDisplay.textContent = formatTime({ hours, minutes, seconds });

    let activeIndex = -1;
    let secondsRemaining = 0;

    for (let i = 0; i < activities.length; i++) {
        const act = activities[i];
        const actStart = act.startHour * 60 + act.startMin;
        const actEnd = act.endHour * 60 + act.endMin;

        if (currentTotalMinutes >= actStart && currentTotalMinutes < actEnd) {
            activeIndex = i;
            // Calculate seconds elapsed since the activity started
            const secondsElapsed = (currentTotalMinutes - actStart) * 60 + seconds;
            const totalDurationSeconds = (actEnd - actStart) * 60;
            secondsRemaining = totalDurationSeconds - secondsElapsed;
            break;
        }
    }

    // Update card highlights
    cards.forEach((card, i) => {
        if (i === activeIndex) {
            card.classList.add('active');
        } else {
            card.classList.remove('active');
        }
    });

    // Update center box
    if (activeIndex >= 0) {
        currentActivityBox.textContent = formatCountdown(secondsRemaining);
    } else {
        currentActivityBox.textContent = 'No Activity';
    }
}

// Run immediately, then update every second
update();
setInterval(update, 1000);
