(function() {
  'use strict';

  var containers = document.querySelectorAll('[data-delivery-date]');
  if (!containers.length) return;

  containers.forEach(function(container) {
    var cutoffHour = parseInt(container.dataset.cutoffHour) || 13;
    var ukMin = parseInt(container.dataset.ukMin) || 1;
    var ukMax = parseInt(container.dataset.ukMax) || 2;
    var euMin = parseInt(container.dataset.euMin) || 3;
    var euMax = parseInt(container.dataset.euMax) || 5;
    var rowMin = parseInt(container.dataset.rowMin) || 5;
    var rowMax = parseInt(container.dataset.rowMax) || 10;
    var blockedRaw = container.dataset.blockedDates || '';
    var accentColor = container.dataset.accentColor || '#4a8c3f';

    var blockedDates = [];
    if (blockedRaw.trim()) {
      blockedDates = blockedRaw.split(',').map(function(d) { return d.trim(); });
    }

    // Pre-order: if a fixed dispatch date is set, use it instead of today
    var preorderDispatchRaw = container.dataset.preorderDispatchDate || '';
    var preorderDispatchDate = null;
    if (preorderDispatchRaw.trim()) {
      var parts = preorderDispatchRaw.trim().split('-');
      if (parts.length === 3) {
        preorderDispatchDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      }
    }

    var flagEl = container.querySelector('[data-delivery-flag]');
    var startEl = container.querySelector('[data-delivery-start]');
    var endEl = container.querySelector('[data-delivery-end]');
    var countdownEl = container.querySelector('[data-delivery-countdown]');
    var cutoffWrap = container.querySelector('[data-delivery-cutoff-wrap]');
    var dispatchLabel = container.querySelector('[data-delivery-dispatch-label]');

    if (accentColor) {
      startEl.style.color = accentColor;
      endEl.style.color = accentColor;
      countdownEl.style.color = accentColor;
      startEl.style.fontWeight = 'bold';
      endEl.style.fontWeight = 'bold';
      countdownEl.style.fontWeight = 'bold';
    }

    function detectRegion() {
      try {
        var tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
        var tzLower = tz.toLowerCase();
        console.log('[DeliveryDate] Timezone:', tz);
        if (tzLower.indexOf('london') !== -1 || tzLower.indexOf('belfast') !== -1 || tzLower === 'europe/london' || tzLower === 'gb') {
          console.log('[DeliveryDate] Region: uk');
          return 'uk';
        }
        var euroPrefixes = ['europe/', 'atlantic/canary', 'atlantic/faroe', 'atlantic/madeira', 'arctic/longyearbyen'];
        for (var i = 0; i < euroPrefixes.length; i++) {
          if (tzLower.indexOf(euroPrefixes[i]) === 0 || tzLower === euroPrefixes[i]) {
            console.log('[DeliveryDate] Region: eu');
            return 'eu';
          }
        }
        console.log('[DeliveryDate] Region: row');
        return 'row';
      } catch(e) { console.log('[DeliveryDate] Error, defaulting to uk'); return 'uk'; }
    }

    function getFlags(region) {
      if (region === 'uk') return '\u{1F1EC}\u{1F1E7}';
      if (region === 'eu') return '\u{1F1EA}\u{1F1FA}';
      return '\u{1F30D}';
    }

    function getDispatchLabel(region) {
      if (region === 'uk') return ' with express delivery.';
      if (region === 'eu') return ' with standard delivery.';
      return ' with international delivery.';
    }

    function getDeliveryDays(region) {
      if (region === 'uk') return { min: ukMin, max: ukMax };
      if (region === 'eu') return { min: euMin, max: euMax };
      return { min: rowMin, max: rowMax };
    }

    function getUKNow() {
      var now = new Date();
      var ukString = now.toLocaleString('en-GB', { timeZone: 'Europe/London' });
      var parts = ukString.split(', ');
      var dateParts = parts[0].split('/');
      var timeParts = parts[1].split(':');
      return {
        year: parseInt(dateParts[2]),
        month: parseInt(dateParts[1]) - 1,
        day: parseInt(dateParts[0]),
        hour: parseInt(timeParts[0]),
        minute: parseInt(timeParts[1]),
        second: parseInt(timeParts[2])
      };
    }

    function isBlocked(date) {
      var dateStr = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
      return blockedDates.indexOf(dateStr) !== -1;
    }

    function isWeekend(date) { var d = date.getDay(); return d === 0 || d === 6; }

    function addBusinessDays(startDate, numDays) {
      var current = new Date(startDate);
      var added = 0;
      while (added < numDays) {
        current.setDate(current.getDate() + 1);
        if (!isWeekend(current) && !isBlocked(current)) added++;
      }
      return current;
    }

    function getDispatchDate() {
      var uk = getUKNow();
      var dispatchDate = new Date(uk.year, uk.month, uk.day);
      if (uk.hour < cutoffHour && !isWeekend(dispatchDate) && !isBlocked(dispatchDate)) {
        return { date: dispatchDate, isToday: true };
      } else {
        var next = new Date(dispatchDate);
        do { next.setDate(next.getDate() + 1); } while (isWeekend(next) || isBlocked(next));
        return { date: next, isToday: false };
      }
    }

    function formatDate(date) {
      var days = ['Sun', 'Mon', 'Tues', 'Wed', 'Thurs', 'Fri', 'Sat'];
      var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      var dayNum = date.getDate();
      var suffix = 'th';
      if (dayNum === 1 || dayNum === 21 || dayNum === 31) suffix = 'st';
      else if (dayNum === 2 || dayNum === 22) suffix = 'nd';
      else if (dayNum === 3 || dayNum === 23) suffix = 'rd';
      return days[date.getDay()] + ' ' + dayNum + suffix + ' ' + months[date.getMonth()];
    }

    function pad(n) { return n < 10 ? '0' + n : '' + n; }

    // Find the next cutoff datetime (UK time)
    function getNextCutoff() {
      var uk = getUKNow();
      var today = new Date(uk.year, uk.month, uk.day);
      var nowSeconds = uk.hour * 3600 + uk.minute * 60 + uk.second;
      var cutoffSeconds = cutoffHour * 3600;

      // If it's a business day and before cutoff, cutoff is today
      if (!isWeekend(today) && !isBlocked(today) && nowSeconds < cutoffSeconds) {
        return { date: today, sameDay: true };
      }

      // Otherwise find next business day
      var next = new Date(today);
      do {
        next.setDate(next.getDate() + 1);
      } while (isWeekend(next) || isBlocked(next));
      return { date: next, sameDay: false };
    }

    function updateCountdown() {
      // Pre-order products don't show the order-by countdown
      if (preorderDispatchDate) {
        if (cutoffWrap) cutoffWrap.style.display = 'none';
        return;
      }

      var uk = getUKNow();
      var cutoffInfo = getNextCutoff();

      // Calculate diff in seconds between now (UK) and cutoff datetime
      var nowMs = new Date(uk.year, uk.month, uk.day, uk.hour, uk.minute, uk.second).getTime();
      var cutoffMs = new Date(cutoffInfo.date.getFullYear(), cutoffInfo.date.getMonth(), cutoffInfo.date.getDate(), cutoffHour, 0, 0).getTime();
      var diff = Math.floor((cutoffMs - nowMs) / 1000);

      if (diff <= 0) {
        cutoffWrap.style.display = 'none';
        renderDates();
        return;
      }

      cutoffWrap.style.display = '';

      var h = Math.floor(diff / 3600);
      var m = Math.floor((diff % 3600) / 60);
      var s = diff % 60;

      countdownEl.textContent = h + 'hrs ' + m + 'mins ' + s + 'secs';
    }

    function renderDates() {
      var region = detectRegion();
      var deliveryDays = getDeliveryDays(region);
      var dispatch;

      // Pre-order override: use fixed dispatch date instead of calculated one
      if (preorderDispatchDate) {
        // Use the pre-order date as the dispatch date
        // If the pre-order date is in the past, fall back to normal logic
        var today = new Date();
        today.setHours(0, 0, 0, 0);
        if (preorderDispatchDate >= today) {
          dispatch = { date: preorderDispatchDate, isToday: false };
        } else {
          dispatch = getDispatchDate();
        }
        // Hide countdown for pre-order products since dispatch is fixed
        if (cutoffWrap) cutoffWrap.style.display = 'none';
      } else {
        dispatch = getDispatchDate();
      }

      var startDate = addBusinessDays(dispatch.date, deliveryDays.min);
      var endDate = addBusinessDays(dispatch.date, deliveryDays.max);

      flagEl.textContent = getFlags(region);
      startEl.textContent = formatDate(startDate);
      endEl.textContent = formatDate(endDate);
      dispatchLabel.textContent = getDispatchLabel(region);
    }

    renderDates();
    updateCountdown();

    setInterval(updateCountdown, 1000);
  });
})();