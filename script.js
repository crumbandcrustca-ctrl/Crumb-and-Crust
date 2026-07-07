/* ==========================================================================
   Crumb & Crust — shared behavior
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- Sticky header shadow ---------- */
  const header = document.querySelector('.site-header');
  if (header) {
    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- Desktop "menu" dropdown ---------- */
  document.querySelectorAll('[data-dropdown-toggle]').forEach((btn) => {
    const menu = btn.nextElementSibling;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = menu.classList.toggle('open');
      btn.setAttribute('aria-expanded', String(isOpen));
    });
  });
  document.addEventListener('click', () => {
    document.querySelectorAll('.dropdown-menu.open').forEach((m) => m.classList.remove('open'));
    document.querySelectorAll('[data-dropdown-toggle]').forEach((b) => b.setAttribute('aria-expanded', 'false'));
  });

  /* ---------- Mobile hamburger nav ---------- */
  const hamburger = document.querySelector('.hamburger');
  const mobileNav = document.querySelector('.mobile-nav');
  if (hamburger && mobileNav) {
    hamburger.addEventListener('click', () => {
      const isOpen = mobileNav.classList.toggle('open');
      hamburger.classList.toggle('is-active', isOpen);
      hamburger.setAttribute('aria-expanded', String(isOpen));
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });
    mobileNav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        mobileNav.classList.remove('open');
        hamburger.classList.remove('is-active');
        document.body.style.overflow = '';
      });
    });
  }

  /* ---------- Mobile "menu" accordion ---------- */
  document.querySelectorAll('[data-mobile-toggle]').forEach((btn) => {
    const submenu = btn.nextElementSibling;
    btn.addEventListener('click', () => {
      submenu.classList.toggle('open');
    });
  });

  /* ---------- Scroll reveal ---------- */
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  /* ---------- Order page ---------- */
  const orderForm = document.getElementById('orderForm');
  if (orderForm) initOrderForm(orderForm);
});

/* ==========================================================================
   Order form
   ========================================================================== */

// EDIT ME: flip these whenever your week fills up or you need a break.
const ORDER_SETTINGS = {
  acceptingOrders: true,     // set to false to close the form and show a "not taking orders" message
  limitedCapacityNote: true, // set to false to hide the "limited spots" line below
};

// EDIT ME: after you create a free form at https://formspree.io and connect
// crumbandcrustca@gmail.com, paste your form endpoint here (looks like
// "https://formspree.io/f/abcduvwx"). Until then, the form will show a
// friendly reminder instead of trying to send.
const FORM_ENDPOINT = 'https://formspree.io/f/YOUR_FORM_ID';

function initOrderForm(form) {
  renderStatusBanner();
  populatePickupDates();
  wireDeliveryToggle();
  wireQtySteppers();
  wireSubmit(form);
}

function renderStatusBanner() {
  const banner = document.getElementById('orderStatus');
  const formWrap = document.getElementById('orderFormWrap');
  if (!banner) return;

  if (!ORDER_SETTINGS.acceptingOrders) {
    banner.className = 'status-banner closed';
    banner.innerHTML = "We&rsquo;re not taking new orders this week &mdash; check back soon, or email us at <a href=\"mailto:crumbandcrustca@gmail.com\">crumbandcrustca@gmail.com</a> and we&rsquo;ll let you know when we reopen.";
    if (formWrap) formWrap.style.display = 'none';
    return;
  }

  let msg = 'Now accepting orders for pickup and delivery this weekend.';
  if (ORDER_SETTINGS.limitedCapacityNote) {
    msg += ' We bake in small batches, so get your order in early in the week.';
  }
  banner.className = 'status-banner open';
  banner.textContent = msg;
}

function populatePickupDates() {
  const select = document.getElementById('pickupDate');
  if (!select) return;

  const dates = [];
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  while (dates.length < 6) {
    cursor.setDate(cursor.getDate() + 1);
    const day = cursor.getDay(); // 6 = Saturday, 0 = Sunday
    if (day === 6 || day === 0) dates.push(new Date(cursor));
  }

  select.innerHTML = '<option value="" disabled selected>Choose a Saturday or Sunday</option>';
  dates.forEach((d) => {
    const label = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    const value = d.toISOString().slice(0, 10);
    const opt = document.createElement('option');
    opt.value = value;
    opt.textContent = label;
    select.appendChild(opt);
  });
}

function wireDeliveryToggle() {
  const radios = document.querySelectorAll('input[name="Fulfillment"]');
  const deliveryFields = document.getElementById('deliveryFields');
  if (!radios.length || !deliveryFields) return;

  const update = () => {
    const checked = document.querySelector('input[name="Fulfillment"]:checked');
    deliveryFields.classList.toggle('show', !!checked && checked.value === 'Delivery');
    deliveryFields.querySelectorAll('input').forEach((i) => {
      i.required = checked && checked.value === 'Delivery';
    });
  };
  radios.forEach((r) => r.addEventListener('change', update));
  update();
}

function wireQtySteppers() {
  document.querySelectorAll('.qty-stepper').forEach((stepper) => {
    const input = stepper.querySelector('.qty-input');
    const minus = stepper.querySelector('.qty-minus');
    const plus = stepper.querySelector('.qty-plus');
    const max = parseInt(input.max || '10', 10);
    const min = parseInt(input.min || '0', 10);

    minus.addEventListener('click', () => {
      input.value = Math.max(min, parseInt(input.value || '0', 10) - 1);
    });
    plus.addEventListener('click', () => {
      input.value = Math.min(max, parseInt(input.value || '0', 10) + 1);
    });
  });
}

function wireSubmit(form) {
  const messageEl = document.getElementById('formMessage');
  const submitBtn = document.getElementById('submitOrder');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    showMessage('', '');

    const qtyInputs = Array.from(document.querySelectorAll('.qty-input'));
    const totalItems = qtyInputs.reduce((sum, i) => sum + (parseInt(i.value, 10) || 0), 0);
    if (totalItems === 0) {
      showMessage('Add at least one item to your order before sending it in.', 'warning');
      return;
    }
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    if (FORM_ENDPOINT.includes('YOUR_FORM_ID')) {
      showMessage("This form isn't connected yet. See the setup note below the form \u2014 once a Formspree endpoint is added, orders will send from right here.", 'warning');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending order\u2026';

    try {
      const res = await fetch(FORM_ENDPOINT, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' },
      });
      if (res.ok) {
        showMessage("Thanks! Your order is in. We'll follow up by phone or email to confirm.", 'success');
        form.reset();
        wireDeliveryToggle();
        qtyInputs.forEach((i) => (i.value = 0));
      } else {
        showMessage('Something went wrong sending that. Please try again, or email crumbandcrustca@gmail.com directly.', 'error');
      }
    } catch (err) {
      showMessage('Something went wrong sending that. Please try again, or email crumbandcrustca@gmail.com directly.', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send order';
    }
  });

  function showMessage(text, type) {
    if (!messageEl) return;
    messageEl.textContent = text;
    messageEl.className = 'form-message' + (type ? ` show ${type}` : '');
  }
}
