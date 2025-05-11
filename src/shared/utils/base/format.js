import { escapeTag } from './string';

function timeToText(sec, isNeedSeconds = false) {
    let n = Number(sec);
    if (isNaN(n)) {
        return escapeTag(sec);
    }
    n = Math.floor(n / 1000);
    const arr = [];
    if (n < 0) {
        n = -n;
    }
    if (n >= 86400) {
        arr.push(`${Math.floor(n / 86400)}d`);
        n %= 86400;
    }
    if (n >= 3600) {
        arr.push(`${Math.floor(n / 3600)}h`);
        n %= 3600;
    }
    if (n >= 60) {
        arr.push(`${Math.floor(n / 60)}m`);
        n %= 60;
    }
    if (isNeedSeconds || (arr.length === 0 && n < 60)) {
        arr.push(`${n}s`);
    }
    return arr.join(' ');
}

async function formatDateFilter(isoFormat, hour12) {
    const currentCulture = await AppApi.CurrentCulture();
    let formatDate1;
    formatDate1 = function (date, format) {
        if (!date) {
            return '-';
        }
        const dt = new Date(date);
        if (format === 'long') {
            return dt.toLocaleDateString(currentCulture, {
                month: '2-digit',
                day: '2-digit',
                year: 'numeric',
                hour: 'numeric',
                minute: 'numeric',
                second: 'numeric',
                hourCycle: hour12 ? 'h12' : 'h23'
            });
        } else if (format === 'short') {
            return dt
                .toLocaleDateString(currentCulture, {
                    month: '2-digit',
                    day: '2-digit',
                    hour: 'numeric',
                    minute: 'numeric',
                    hourCycle: hour12 ? 'h12' : 'h23'
                })
                .replace(' AM', 'am')
                .replace(' PM', 'pm')
                .replace(',', '');
        }
        return '-';
    };
    if (isoFormat) {
        formatDate1 = function (date, format) {
            if (!date) {
                return '-';
            }
            const dt = new Date(date);
            if (format === 'long') {
                const formatDate = (date) => {
                    const padZero = (num) => String(num).padStart(2, '0');

                    const year = date.getFullYear();
                    const month = padZero(date.getMonth() + 1);
                    const day = padZero(date.getDate());
                    const hours = padZero(date.getHours());
                    const minutes = padZero(date.getMinutes());
                    const seconds = padZero(date.getSeconds());

                    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
                };

                return formatDate(dt);
            } else if (format === 'short') {
                return dt
                    .toLocaleDateString('en-nz', {
                        month: '2-digit',
                        day: '2-digit',
                        hour: 'numeric',
                        minute: 'numeric',
                        hourCycle: hour12 ? 'h12' : 'h23'
                    })
                    .replace(' AM', 'am')
                    .replace(' PM', 'pm')
                    .replace(',', '');
            }
            return '-';
        };
    }
    return formatDate1;
}

export { timeToText, formatDateFilter };
