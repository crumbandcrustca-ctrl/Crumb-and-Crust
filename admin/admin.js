"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const app = document.getElementById("app");

  if (!app) {
    console.error('Admin dashboard could not find an element with id="app".');
    return;
  }

  const STORAGE_KEYS = {
    vacation: "crumbAndCrustVacation",
    orders: "crumbAndCrustOrders",
    products: "crumbAndCrustProducts",
    coupons: "crumbAndCrustCoupons",
    settings: "crumbAndCrustSettings"
  };

  const defaultState = {
    activePage: "dashboard",

    vacation: {
      enabled: false,
      message: "We are temporarily closed for orders.",
      reopenDate: ""
    },

    orders: [
      {
        id: "CC-1001",
        customer: "Sample Customer",
        item: "Chocolate Chip Cookies",
        total: 18,
        status: "New",
        createdAt: new Date().toISOString()
      }
    ],

    products: [
      {
        id: createId(),
        name: "Chocolate Chip Cookies",
        price: 18,
        available: true
      },
      {
        id: createId(),
        name: "Brownies",
        price: 22,
        available: true
      }
    ],

    coupons: [],

    settings: {
      bakeryName: "Crumb & Crust",
      email: "",
      phone: ""
    }
  };

  const state = {
    activePage: defaultState.activePage,
    vacation: loadData(STORAGE_KEYS.vacation, defaultState.vacation),
    orders: loadData(STORAGE_KEYS.orders, defaultState.orders),
    products: loadData(STORAGE_KEYS.products, defaultState.products),
    coupons: loadData(STORAGE_KEYS.coupons, defaultState.coupons),
    settings: loadData(STORAGE_KEYS.settings, defaultState.settings)
  };

  function createId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function loadData(key, fallback) {
    try {
      const saved = localStorage.getItem(key);

      if (!saved) {
        return structuredCloneSafe(fallback);
      }

      return JSON.parse(saved);
    } catch (error) {
      console.warn(`Could not load ${key}:`, error);
      return structuredCloneSafe(fallback);
    }
  }

  function saveData(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Could not save ${key}:`, error);
      showToast("Your changes could not be saved.", "error");
    }
  }

  function structuredCloneSafe(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function formatMoney(value) {
    const amount = Number(value) || 0;

    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD"
    }).format(amount);
  }

  function formatDate(value) {
    if (!value) {
      return "Not set";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return escapeHtml(value);
    }

    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    }).format(date);
  }

  function showToast(message, type = "success") {
    const existingToast = document.querySelector(".admin-toast");

    if (existingToast) {
      existingToast.remove();
    }

    const toast = document.createElement("div");
    toast.className = `admin-toast admin-toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    window.setTimeout(() => {
      toast.classList.add("visible");
    }, 10);

    window.setTimeout(() => {
      toast.classList.remove("visible");

      window.setTimeout(() => {
        toast.remove();
      }, 250);
    }, 2500);
  }

  function getOpenOrders() {
    return state.orders.filter(
      order => order.status !== "Completed" && order.status !== "Cancelled"
    );
  }

  function getMonthlyRevenue() {
    const now = new Date();

    return state.orders
      .filter(order => {
        const orderDate = new Date(order.createdAt);

        return (
          order.status !== "Cancelled" &&
          orderDate.getMonth() === now.getMonth() &&
          orderDate.getFullYear() === now.getFullYear()
        );
      })
      .reduce((total, order) => total + Number(order.total || 0), 0);
  }

  function renderApp() {
    app.innerHTML = `
      <div class="admin-layout">
        <aside class="sidebar">
          <div class="sidebar-brand">
            <span class="brand-mark">C&amp;C</span>

            <div>
              <h2>${escapeHtml(state.settings.bakeryName)}</h2>
              <p>Admin Panel</p>
            </div>
          </div>

          <nav class="sidebar-nav" aria-label="Admin navigation">
            ${createNavButton("dashboard", "Dashboard")}
            ${createNavButton("orders", "Orders")}
            ${createNavButton("vacation", "Vacation Mode")}
            ${createNavButton("products", "Products")}
            ${createNavButton("coupons", "Coupons")}
            ${createNavButton("analytics", "Analytics")}
            ${createNavButton("settings", "Settings")}
          </nav>

          <div class="sidebar-footer">
            <span class="status-dot"></span>
            <span>Admin dashboard</span>
          </div>
        </aside>

        <main class="main-content">
          <header class="topbar">
            <div>
              <p class="eyebrow">Crumb &amp; Crust</p>
              <h1>${getPageTitle()}</h1>
            </div>

            <button class="mobile-menu-button" id="mobileMenuButton" type="button">
              Menu
            </button>
          </header>

          <section id="pageContent" class="page-content"></section>
        </main>
      </div>
    `;

    bindNavigation();
    renderPage();
  }

  function createNavButton(page, label) {
    const activeClass = state.activePage === page ? "active" : "";

    return `
      <button
        class="nav-button ${activeClass}"
        data-page="${page}"
        type="button"
      >
        ${label}
      </button>
    `;
  }

  function getPageTitle() {
    const titles = {
      dashboard: "Dashboard",
      orders: "Orders",
      vacation: "Vacation Mode",
      products: "Products",
      coupons: "Coupons",
      analytics: "Analytics",
      settings: "Settings"
    };

    return titles[state.activePage] || "Dashboard";
  }

  function bindNavigation() {
    document.querySelectorAll("[data-page]").forEach(button => {
      button.addEventListener("click", () => {
        state.activePage = button.dataset.page;
        renderApp();
      });
    });

    const menuButton = document.getElementById("mobileMenuButton");
    const sidebar = document.querySelector(".sidebar");

    if (menuButton && sidebar) {
      menuButton.addEventListener("click", () => {
        sidebar.classList.toggle("open");
      });
    }
  }

  function renderPage() {
    const pageContent = document.getElementById("pageContent");

    if (!pageContent) {
      return;
    }

    switch (state.activePage) {
      case "orders":
        renderOrders(pageContent);
        break;

      case "vacation":
        renderVacationMode(pageContent);
        break;

      case "products":
        renderProducts(pageContent);
        break;

      case "coupons":
        renderCoupons(pageContent);
        break;

      case "analytics":
        renderAnalytics(pageContent);
        break;

      case "settings":
        renderSettings(pageContent);
        break;

      default:
        renderDashboard(pageContent);
    }
  }

  function renderDashboard(container) {
    const openOrders = getOpenOrders();
    const availableProducts = state.products.filter(product => product.available);
    const activeCoupons = state.coupons.filter(coupon => coupon.active);

    container.innerHTML = `
      <div class="welcome-panel">
        <div>
          <p class="eyebrow">Overview</p>
          <h2>Welcome back.</h2>
          <p>Manage orders, products and store availability from one place.</p>
        </div>

        <button class="primary-button" id="viewOrdersButton" type="button">
          View orders
        </button>
      </div>

      <div class="dashboard-cards">
        <article class="dashboard-card">
          <p class="card-label">Open orders</p>
          <strong>${openOrders.length}</strong>
          <span>${state.orders.length} total orders</span>
        </article>

        <article class="dashboard-card">
          <p class="card-label">Vacation mode</p>
          <strong>${state.vacation.enabled ? "On" : "Off"}</strong>
          <span>
            ${state.vacation.enabled ? "Ordering is paused" : "Ordering is open"}
          </span>
        </article>

        <article class="dashboard-card">
          <p class="card-label">Available products</p>
          <strong>${availableProducts.length}</strong>
          <span>${state.products.length} products total</span>
        </article>

        <article class="dashboard-card">
          <p class="card-label">Active coupons</p>
          <strong>${activeCoupons.length}</strong>
          <span>${state.coupons.length} coupons total</span>
        </article>
      </div>

      <div class="content-grid">
        <section class="panel">
          <div class="panel-header">
            <div>
              <p class="eyebrow">Recent activity</p>
              <h2>Latest orders</h2>
            </div>
          </div>

          ${createRecentOrdersTable()}
        </section>

        <section class="panel">
          <div class="panel-header">
            <div>
              <p class="eyebrow">Store status</p>
              <h2>Ordering availability</h2>
            </div>
          </div>

          <div class="status-card ${
            state.vacation.enabled ? "status-closed" : "status-open"
          }">
            <strong>
              ${state.vacation.enabled ? "Orders paused" : "Orders open"}
            </strong>

            <p>
              ${
                state.vacation.enabled
                  ? escapeHtml(state.vacation.message)
                  : "Customers can currently place orders."
              }
            </p>

            <button class="secondary-button" id="manageVacationButton" type="button">
              Manage vacation mode
            </button>
          </div>
        </section>
      </div>
    `;

    document.getElementById("viewOrdersButton")?.addEventListener("click", () => {
      state.activePage = "orders";
      renderApp();
    });

    document
      .getElementById("manageVacationButton")
      ?.addEventListener("click", () => {
        state.activePage = "vacation";
        renderApp();
      });
  }

  function createRecentOrdersTable() {
    const recentOrders = [...state.orders]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);

    if (recentOrders.length === 0) {
      return createEmptyState(
        "No orders yet",
        "New customer orders will appear here."
      );
    }

    return `
      <div class="table-wrapper">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Total</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            ${recentOrders
              .map(
                order => `
                  <tr>
                    <td>${escapeHtml(order.id)}</td>
                    <td>${escapeHtml(order.customer)}</td>
                    <td>${formatMoney(order.total)}</td>
                    <td>
                      <span class="status-badge status-${order.status
                        .toLowerCase()
                        .replaceAll(" ", "-")}">
                        ${escapeHtml(order.status)}
                      </span>
                    </td>
                  </tr>
                `
              )
              .join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  function renderOrders(container) {
    container.innerHTML = `
      <div class="panel">
        <div class="panel-header">
          <div>
            <p class="eyebrow">Order management</p>
            <h2>Customer orders</h2>
          </div>

          <button class="primary-button" id="addOrderButton" type="button">
            Add order
          </button>
        </div>

        <div id="orderFormArea"></div>

        ${
          state.orders.length
            ? createOrdersTable()
            : createEmptyState(
                "No orders yet",
                "Create an order or connect Firebase later to receive live orders."
              )
        }
      </div>
    `;

    document.getElementById("addOrderButton")?.addEventListener("click", () => {
      renderOrderForm();
    });

    bindOrderActions();
  }

  function createOrdersTable() {
    return `
      <div class="table-wrapper">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Item</th>
              <th>Total</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            ${state.orders
              .map(
                order => `
                  <tr>
                    <td>${escapeHtml(order.id)}</td>
                    <td>${escapeHtml(order.customer)}</td>
                    <td>${escapeHtml(order.item)}</td>
                    <td>${formatMoney(order.total)}</td>
                    <td>
                      <select
                        class="status-select"
                        data-order-status="${escapeHtml(order.id)}"
                        aria-label="Status for order ${escapeHtml(order.id)}"
                      >
                        ${["New", "Preparing", "Ready", "Completed", "Cancelled"]
                          .map(
                            status => `
                              <option
                                value="${status}"
                                ${order.status === status ? "selected" : ""}
                              >
                                ${status}
                              </option>
                            `
                          )
                          .join("")}
                      </select>
                    </td>
                    <td>
                      <button
                        class="danger-button small-button"
                        data-delete-order="${escapeHtml(order.id)}"
                        type="button"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                `
              )
              .join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  function renderOrderForm() {
    const formArea = document.getElementById("orderFormArea");

    if (!formArea) {
      return;
    }

    formArea.innerHTML = `
      <form class="admin-form inline-form" id="orderForm">
        <label>
          Customer name
          <input name="customer" type="text" required maxlength="80">
        </label>

        <label>
          Item
          <input name="item" type="text" required maxlength="100">
        </label>

        <label>
          Total
          <input name="total" type="number" required min="0" step="0.01">
        </label>

        <div class="form-actions">
          <button class="primary-button" type="submit">Save order</button>
          <button class="secondary-button" id="cancelOrderButton" type="button">
            Cancel
          </button>
        </div>
      </form>
    `;

    document.getElementById("cancelOrderButton")?.addEventListener("click", () => {
      formArea.innerHTML = "";
    });

    document.getElementById("orderForm")?.addEventListener("submit", event => {
      event.preventDefault();

      const formData = new FormData(event.currentTarget);

      const nextNumber = state.orders.length + 1001;

      state.orders.unshift({
        id: `CC-${nextNumber}`,
        customer: formData.get("customer").trim(),
        item: formData.get("item").trim(),
        total: Number(formData.get("total")),
        status: "New",
        createdAt: new Date().toISOString()
      });

      saveData(STORAGE_KEYS.orders, state.orders);
      showToast("Order added.");
      renderOrders(document.getElementById("pageContent"));
    });
  }

  function bindOrderActions() {
    document.querySelectorAll("[data-order-status]").forEach(select => {
      select.addEventListener("change", () => {
        const order = state.orders.find(
          item => item.id === select.dataset.orderStatus
        );

        if (!order) {
          return;
        }

        order.status = select.value;
        saveData(STORAGE_KEYS.orders, state.orders);
        showToast("Order status updated.");
      });
    });

    document.querySelectorAll("[data-delete-order]").forEach(button => {
      button.addEventListener("click", () => {
        const orderId = button.dataset.deleteOrder;

        if (!window.confirm(`Delete order ${orderId}?`)) {
          return;
        }

        state.orders = state.orders.filter(order => order.id !== orderId);
        saveData(STORAGE_KEYS.orders, state.orders);
        showToast("Order deleted.");
        renderOrders(document.getElementById("pageContent"));
      });
    });
  }

  function renderVacationMode(container) {
    container.innerHTML = `
      <div class="panel narrow-panel">
        <div class="panel-header">
          <div>
            <p class="eyebrow">Store availability</p>
            <h2>Vacation mode</h2>
          </div>

          <span class="status-badge ${
            state.vacation.enabled ? "status-cancelled" : "status-completed"
          }">
            ${state.vacation.enabled ? "Enabled" : "Disabled"}
          </span>
        </div>

        <form class="admin-form" id="vacationForm">
          <label class="toggle-row">
            <span>
              <strong>Pause customer orders</strong>
              <small>Customers will see your closure message.</small>
            </span>

            <input
              name="enabled"
              type="checkbox"
              ${state.vacation.enabled ? "checked" : ""}
            >
          </label>

          <label>
            Closure message
            <textarea
              name="message"
              rows="4"
              maxlength="250"
              required
            >${escapeHtml(state.vacation.message)}</textarea>
          </label>

          <label>
            Reopening date
            <input
              name="reopenDate"
              type="date"
              value="${escapeHtml(state.vacation.reopenDate)}"
            >
          </label>

          <button class="primary-button" type="submit">
            Save vacation settings
          </button>
        </form>
      </div>
    `;

    document.getElementById("vacationForm")?.addEventListener("submit", event => {
      event.preventDefault();

      const formData = new FormData(event.currentTarget);

      state.vacation = {
        enabled: formData.get("enabled") === "on",
        message: formData.get("message").trim(),
        reopenDate: formData.get("reopenDate")
      };

      saveData(STORAGE_KEYS.vacation, state.vacation);
      showToast("Vacation settings saved.");
      renderVacationMode(document.getElementById("pageContent"));
    });
  }

  function renderProducts(container) {
    container.innerHTML = `
      <div class="panel">
        <div class="panel-header">
          <div>
            <p class="eyebrow">Menu management</p>
            <h2>Products</h2>
          </div>

          <button class="primary-button" id="addProductButton" type="button">
            Add product
          </button>
        </div>

        <div id="productFormArea"></div>

        <div class="product-grid">
          ${
            state.products.length
              ? state.products.map(createProductCard).join("")
              : createEmptyState(
                  "No products yet",
                  "Add your first bakery product."
                )
          }
        </div>
      </div>
    `;

    document.getElementById("addProductButton")?.addEventListener("click", () => {
      renderProductForm();
    });

    document.querySelectorAll("[data-toggle-product]").forEach(button => {
      button.addEventListener("click", () => {
        const product = state.products.find(
          item => item.id === button.dataset.toggleProduct
        );

        if (!product) {
          return;
        }

        product.available = !product.available;
        saveData(STORAGE_KEYS.products, state.products);
        showToast("Product availability updated.");
        renderProducts(document.getElementById("pageContent"));
      });
    });

    document.querySelectorAll("[data-delete-product]").forEach(button => {
      button.addEventListener("click", () => {
        if (!window.confirm("Delete this product?")) {
          return;
        }

        state.products = state.products.filter(
          product => product.id !== button.dataset.deleteProduct
        );

        saveData(STORAGE_KEYS.products, state.products);
        showToast("Product deleted.");
        renderProducts(document.getElementById("pageContent"));
      });
    });
  }

  function createProductCard(product) {
    return `
      <article class="product-card">
        <div>
          <span class="status-badge ${
            product.available ? "status-completed" : "status-cancelled"
          }">
            ${product.available ? "Available" : "Unavailable"}
          </span>

          <h3>${escapeHtml(product.name)}</h3>
          <strong>${formatMoney(product.price)}</strong>
        </div>

        <div class="card-actions">
          <button
            class="secondary-button small-button"
            data-toggle-product="${escapeHtml(product.id)}"
            type="button"
          >
            ${product.available ? "Mark unavailable" : "Mark available"}
          </button>

          <button
            class="danger-button small-button"
            data-delete-product="${escapeHtml(product.id)}"
            type="button"
          >
            Delete
          </button>
        </div>
      </article>
    `;
  }

  function renderProductForm() {
    const formArea = document.getElementById("productFormArea");

    if (!formArea) {
      return;
    }

    formArea.innerHTML = `
      <form class="admin-form inline-form" id="productForm">
        <label>
          Product name
          <input name="name" type="text" required maxlength="100">
        </label>

        <label>
          Price
          <input name="price" type="number" required min="0" step="0.01">
        </label>

        <div class="form-actions">
          <button class="primary-button" type="submit">Save product</button>
          <button class="secondary-button" id="cancelProductButton" type="button">
            Cancel
          </button>
        </div>
      </form>
    `;

    document
      .getElementById("cancelProductButton")
      ?.addEventListener("click", () => {
        formArea.innerHTML = "";
      });

    document.getElementById("productForm")?.addEventListener("submit", event => {
      event.preventDefault();

      const formData = new FormData(event.currentTarget);

      state.products.push({
        id: createId(),
        name: formData.get("name").trim(),
        price: Number(formData.get("price")),
        available: true
      });

      saveData(STORAGE_KEYS.products, state.products);
      showToast("Product added.");
      renderProducts(document.getElementById("pageContent"));
    });
  }

  function renderCoupons(container) {
    container.innerHTML = `
      <div class="panel">
        <div class="panel-header">
          <div>
            <p class="eyebrow">Promotions</p>
            <h2>Coupons</h2>
          </div>
        </div>

        <form class="admin-form inline-form" id="couponForm">
          <label>
            Coupon code
            <input
              name="code"
              type="text"
              required
              maxlength="25"
              placeholder="WELCOME10"
            >
          </label>

          <label>
            Discount percentage
            <input
              name="discount"
              type="number"
              required
              min="1"
              max="100"
            >
          </label>

          <button class="primary-button" type="submit">Add coupon</button>
        </form>

        <div class="coupon-list">
          ${
            state.coupons.length
              ? state.coupons.map(createCouponCard).join("")
              : createEmptyState(
                  "No coupons yet",
                  "Create a discount code for customers."
                )
          }
        </div>
      </div>
    `;

    document.getElementById("couponForm")?.addEventListener("submit", event => {
      event.preventDefault();

      const formData = new FormData(event.currentTarget);
      const code = formData.get("code").trim().toUpperCase();

      const codeAlreadyExists = state.coupons.some(
        coupon => coupon.code.toUpperCase() === code
      );

      if (codeAlreadyExists) {
        showToast("That coupon code already exists.", "error");
        return;
      }

      state.coupons.push({
        id: createId(),
        code,
        discount: Number(formData.get("discount")),
        active: true
      });

      saveData(STORAGE_KEYS.coupons, state.coupons);
      showToast("Coupon added.");
      renderCoupons(document.getElementById("pageContent"));
    });

    document.querySelectorAll("[data-toggle-coupon]").forEach(button => {
      button.addEventListener("click", () => {
        const coupon = state.coupons.find(
          item => item.id === button.dataset.toggleCoupon
        );

        if (!coupon) {
          return;
        }

        coupon.active = !coupon.active;
        saveData(STORAGE_KEYS.coupons, state.coupons);
        showToast("Coupon updated.");
        renderCoupons(document.getElementById("pageContent"));
      });
    });

    document.querySelectorAll("[data-delete-coupon]").forEach(button => {
      button.addEventListener("click", () => {
        state.coupons = state.coupons.filter(
          coupon => coupon.id !== button.dataset.deleteCoupon
        );

        saveData(STORAGE_KEYS.coupons, state.coupons);
        showToast("Coupon deleted.");
        renderCoupons(document.getElementById("pageContent"));
      });
    });
  }

  function createCouponCard(coupon) {
    return `
      <article class="coupon-card">
        <div>
          <span class="status-badge ${
            coupon.active ? "status-completed" : "status-cancelled"
          }">
            ${coupon.active ? "Active" : "Inactive"}
          </span>

          <h3>${escapeHtml(coupon.code)}</h3>
          <p>${escapeHtml(coupon.discount)}% off</p>
        </div>

        <div class="card-actions">
          <button
            class="secondary-button small-button"
            data-toggle-coupon="${escapeHtml(coupon.id)}"
            type="button"
          >
            ${coupon.active ? "Deactivate" : "Activate"}
          </button>

          <button
            class="danger-button small-button"
            data-delete-coupon="${escapeHtml(coupon.id)}"
            type="button"
          >
            Delete
          </button>
        </div>
      </article>
    `;
  }

  function renderAnalytics(container) {
    const completedOrders = state.orders.filter(
      order => order.status === "Completed"
    ).length;

    const cancelledOrders = state.orders.filter(
      order => order.status === "Cancelled"
    ).length;

    container.innerHTML = `
      <div class="dashboard-cards">
        <article class="dashboard-card">
          <p class="card-label">Monthly revenue</p>
          <strong>${formatMoney(getMonthlyRevenue())}</strong>
          <span>Excludes cancelled orders</span>
        </article>

        <article class="dashboard-card">
          <p class="card-label">Total orders</p>
          <strong>${state.orders.length}</strong>
          <span>All recorded orders</span>
        </article>

        <article class="dashboard-card">
          <p class="card-label">Completed</p>
          <strong>${completedOrders}</strong>
          <span>Finished orders</span>
        </article>

        <article class="dashboard-card">
          <p class="card-label">Cancelled</p>
          <strong>${cancelledOrders}</strong>
          <span>Cancelled orders</span>
        </article>
      </div>

      <div class="panel">
        <div class="panel-header">
          <div>
            <p class="eyebrow">Order breakdown</p>
            <h2>Status summary</h2>
          </div>
        </div>

        <div class="analytics-list">
          ${["New", "Preparing", "Ready", "Completed", "Cancelled"]
            .map(status => {
              const count = state.orders.filter(
                order => order.status === status
              ).length;

              const percentage = state.orders.length
                ? Math.round((count / state.orders.length) * 100)
                : 0;

              return `
                <div class="analytics-row">
                  <div>
                    <strong>${status}</strong>
                    <span>${count} orders</span>
                  </div>

                  <div class="progress-track">
                    <span style="width: ${percentage}%"></span>
                  </div>

                  <strong>${percentage}%</strong>
                </div>
              `;
            })
            .join("")}
        </div>
      </div>
    `;
  }

  function renderSettings(container) {
    container.innerHTML = `
      <div class="panel narrow-panel">
        <div class="panel-header">
          <div>
            <p class="eyebrow">Business details</p>
            <h2>Settings</h2>
          </div>
        </div>

        <form class="admin-form" id="settingsForm">
          <label>
            Bakery name
            <input
              name="bakeryName"
              type="text"
              required
              maxlength="80"
              value="${escapeHtml(state.settings.bakeryName)}"
            >
          </label>

          <label>
            Contact email
            <input
              name="email"
              type="email"
              maxlength="120"
              value="${escapeHtml(state.settings.email)}"
            >
          </label>

          <label>
            Phone number
            <input
              name="phone"
              type="tel"
              maxlength="30"
              value="${escapeHtml(state.settings.phone)}"
            >
          </label>

          <button class="primary-button" type="submit">Save settings</button>
        </form>

        <div class="danger-zone">
          <h3>Reset local dashboard data</h3>
          <p>
            This removes the orders, products, coupons and settings stored on
            this browser.
          </p>

          <button class="danger-button" id="resetDashboardButton" type="button">
            Reset dashboard
          </button>
        </div>
      </div>
    `;

    document.getElementById("settingsForm")?.addEventListener("submit", event => {
      event.preventDefault();

      const formData = new FormData(event.currentTarget);

      state.settings = {
        bakeryName: formData.get("bakeryName").trim(),
        email: formData.get("email").trim(),
        phone: formData.get("phone").trim()
      };

      saveData(STORAGE_KEYS.settings, state.settings);
      showToast("Settings saved.");
      renderApp();
    });

    document
      .getElementById("resetDashboardButton")
      ?.addEventListener("click", () => {
        const confirmed = window.confirm(
          "Reset all locally stored admin dashboard data?"
        );

        if (!confirmed) {
          return;
        }

        Object.values(STORAGE_KEYS).forEach(key => {
          localStorage.removeItem(key);
        });

        window.location.reload();
      });
  }

  function createEmptyState(title, message) {
    return `
      <div class="empty-state">
        <h3>${escapeHtml(title)}</h3>
        <p>${escapeHtml(message)}</p>
      </div>
    `;
  }

  renderApp();
});
:root {
  --cream: #f6efe5;
  --paper: #fffaf3;
  --white: #ffffff;
  --brown: #4d2f22;
  --brown-dark: #2f1b14;
  --brown-light: #7b5a47;
  --gold: #d8a348;
  --gold-dark: #b98228;
  --green: #3f7d57;
  --green-light: #e7f3eb;
  --red: #a8463f;
  --red-light: #fae9e7;
  --blue: #456e9c;
  --blue-light: #e9f0f8;
  --orange: #b96b28;
  --orange-light: #fff0df;
  --border: #e2d3c3;
  --muted: #7f7167;
  --shadow: 0 12px 30px rgba(64, 39, 27, 0.1);
  --radius: 18px;
}

* {
  box-sizing: border-box;
}

html {
  min-height: 100%;
}

body {
  min-height: 100vh;
  margin: 0;
  background: var(--cream);
  color: var(--brown-dark);
  font-family:
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    Arial,
    Helvetica,
    sans-serif;
}

button,
input,
textarea,
select {
  font: inherit;
}

button {
  cursor: pointer;
}

button:focus-visible,
input:focus-visible,
textarea:focus-visible,
select:focus-visible {
  outline: 3px solid rgba(216, 163, 72, 0.35);
  outline-offset: 2px;
}

#app {
  min-height: 100vh;
}

.admin-layout {
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr);
  min-height: 100vh;
}

.sidebar {
  position: sticky;
  top: 0;
  height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 24px 18px;
  background: var(--brown-dark);
  color: var(--white);
  overflow-y: auto;
  z-index: 20;
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 4px 8px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
}

.sidebar-brand h2 {
  margin: 0;
  font-size: 1rem;
  line-height: 1.2;
}

.sidebar-brand p {
  margin: 4px 0 0;
  color: rgba(255, 255, 255, 0.62);
  font-size: 0.8rem;
}

.brand-mark {
  display: grid;
  place-items: center;
  width: 46px;
  height: 46px;
  flex-shrink: 0;
  border-radius: 14px;
  background: var(--gold);
  color: var(--brown-dark);
  font-weight: 800;
}

.sidebar-nav {
  display: grid;
  gap: 8px;
  margin-top: 24px;
}

.nav-button {
  width: 100%;
  padding: 13px 14px;
  border: 0;
  border-radius: 12px;
  background: transparent;
  color: rgba(255, 255, 255, 0.74);
  text-align: left;
  font-weight: 650;
  transition:
    background 0.18s ease,
    color 0.18s ease,
    transform 0.18s ease;
}

.nav-button:hover {
  background: rgba(255, 255, 255, 0.08);
  color: var(--white);
  transform: translateX(2px);
}

.nav-button.active {
  background: var(--gold);
  color: var(--brown-dark);
}

.sidebar-footer {
  display: flex;
  align-items: center;
  gap: 9px;
  margin-top: auto;
  padding: 18px 8px 4px;
  color: rgba(255, 255, 255, 0.65);
  font-size: 0.8rem;
}

.status-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #77d596;
  box-shadow: 0 0 0 4px rgba(119, 213, 150, 0.14);
}

.main-content {
  min-width: 0;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 28px 32px 18px;
}

.topbar h1 {
  margin: 2px 0 0;
  color: var(--brown-dark);
  font-size: clamp(1.7rem, 4vw, 2.25rem);
}

.eyebrow {
  margin: 0;
  color: var(--gold-dark);
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.13em;
  text-transform: uppercase;
}

.mobile-menu-button {
  display: none;
  padding: 10px 14px;
  border: 1px solid var(--border);
  border-radius: 11px;
  background: var(--paper);
  color: var(--brown);
  font-weight: 700;
}

.page-content {
  padding: 10px 32px 40px;
}

.welcome-panel {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 22px;
  padding: 28px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background:
    linear-gradient(
      135deg,
      rgba(216, 163, 72, 0.16),
      rgba(255, 255, 255, 0.8)
    ),
    var(--paper);
  box-shadow: var(--shadow);
}

.welcome-panel h2 {
  margin: 5px 0 8px;
  font-size: 1.7rem;
}

.welcome-panel p:last-child {
  margin: 0;
  color: var(--muted);
  line-height: 1.55;
}

.dashboard-cards {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 22px;
}

.dashboard-card {
  padding: 22px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--paper);
  box-shadow: var(--shadow);
}

.card-label {
  margin: 0 0 12px;
  color: var(--muted);
  font-size: 0.82rem;
  font-weight: 700;
}

.dashboard-card strong {
  display: block;
  margin-bottom: 8px;
  color: var(--brown-dark);
  font-size: 1.75rem;
}

.dashboard-card span {
  color: var(--muted);
  font-size: 0.83rem;
}

.content-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(280px, 0.75fr);
  gap: 18px;
}

.panel {
  padding: 24px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--paper);
  box-shadow: var(--shadow);
}

.narrow-panel {
  max-width: 760px;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 22px;
}

.panel-header h2 {
  margin: 4px 0 0;
  color: var(--brown-dark);
  font-size: 1.35rem;
}

.primary-button,
.secondary-button,
.danger-button {
  border-radius: 11px;
  font-weight: 750;
  transition:
    transform 0.16s ease,
    box-shadow 0.16s ease,
    background 0.16s ease;
}

.primary-button:hover,
.secondary-button:hover,
.danger-button:hover {
  transform: translateY(-1px);
}

.primary-button {
  padding: 11px 16px;
  border: 1px solid var(--gold-dark);
  background: var(--gold);
  color: var(--brown-dark);
  box-shadow: 0 7px 16px rgba(185, 130, 40, 0.2);
}

.primary-button:hover {
  background: #e0ae59;
}

.secondary-button {
  padding: 10px 14px;
  border: 1px solid var(--border);
  background: var(--white);
  color: var(--brown);
}

.secondary-button:hover {
  background: #fbf5ed;
}

.danger-button {
  padding: 10px 14px;
  border: 1px solid #d9a29d;
  background: var(--red-light);
  color: var(--red);
}

.danger-button:hover {
  background: #f5d8d5;
}

.small-button {
  padding: 8px 11px;
  font-size: 0.78rem;
}

.status-card {
  padding: 20px;
  border-radius: 14px;
}

.status-card strong {
  display: block;
  margin-bottom: 8px;
  font-size: 1.1rem;
}

.status-card p {
  margin: 0 0 18px;
  line-height: 1.5;
}

.status-open {
  border: 1px solid #acd0b7;
  background: var(--green-light);
  color: #245a37;
}

.status-closed {
  border: 1px solid #deb0ab;
  background: var(--red-light);
  color: #7c302b;
}

.table-wrapper {
  overflow-x: auto;
  border: 1px solid var(--border);
  border-radius: 13px;
}

.admin-table {
  width: 100%;
  min-width: 680px;
  border-collapse: collapse;
  background: var(--white);
}

.admin-table th,
.admin-table td {
  padding: 14px 15px;
  border-bottom: 1px solid #eee2d6;
  text-align: left;
  vertical-align: middle;
}

.admin-table th {
  background: #f8f0e7;
  color: var(--brown-light);
  font-size: 0.76rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.admin-table td {
  color: #45372f;
  font-size: 0.88rem;
}

.admin-table tbody tr:last-child td {
  border-bottom: 0;
}

.admin-table tbody tr:hover {
  background: #fffaf5;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  min-height: 26px;
  padding: 4px 9px;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 800;
  white-space: nowrap;
}

.status-new {
  background: var(--blue-light);
  color: var(--blue);
}

.status-preparing {
  background: var(--orange-light);
  color: var(--orange);
}

.status-ready {
  background: #f4edff;
  color: #6c4aa1;
}

.status-completed {
  background: var(--green-light);
  color: var(--green);
}

.status-cancelled {
  background: var(--red-light);
  color: var(--red);
}

.status-select {
  min-width: 120px;
  padding: 8px 10px;
  border: 1px solid var(--border);
  border-radius: 9px;
  background: var(--white);
  color: var(--brown-dark);
}

.admin-form {
  display: grid;
  gap: 18px;
}

.admin-form label {
  display: grid;
  gap: 7px;
  color: var(--brown);
  font-size: 0.87rem;
  font-weight: 750;
}

.admin-form input,
.admin-form textarea,
.admin-form select {
  width: 100%;
  padding: 12px 13px;
  border: 1px solid var(--border);
  border-radius: 11px;
  background: var(--white);
  color: var(--brown-dark);
}

.admin-form input::placeholder,
.admin-form textarea::placeholder {
  color: #a49387;
}

.admin-form input:focus,
.admin-form textarea:focus,
.admin-form select:focus {
  border-color: var(--gold);
}

.admin-form textarea {
  resize: vertical;
}

.inline-form {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  align-items: end;
  margin-bottom: 22px;
  padding: 18px;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: #fbf5ee;
}

.form-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.toggle-row {
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  padding: 16px;
  border: 1px solid var(--border);
  border-radius: 13px;
  background: var(--white);
}

.toggle-row span {
  display: grid;
  gap: 4px;
}

.toggle-row small {
  color: var(--muted);
  font-weight: 500;
}

.toggle-row input[type="checkbox"] {
  width: 22px;
  height: 22px;
  accent-color: var(--gold-dark);
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 15px;
}

.product-card,
.coupon-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 20px;
  min-height: 190px;
  padding: 19px;
  border: 1px solid var(--border);
  border-radius: 15px;
  background: var(--white);
}

.product-card h3,
.coupon-card h3 {
  margin: 14px 0 6px;
  font-size: 1.04rem;
}

.product-card strong {
  color: var(--gold-dark);
  font-size: 1.2rem;
}

.coupon-card p {
  margin: 0;
  color: var(--muted);
}

.card-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 9px;
}

.coupon-list {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 15px;
}

.empty-state {
  padding: 34px 20px;
  border: 1px dashed #d8c4af;
  border-radius: 14px;
  background: #fffaf5;
  text-align: center;
}

.empty-state h3 {
  margin: 0 0 8px;
}

.empty-state p {
  margin: 0;
  color: var(--muted);
}

.analytics-list {
  display: grid;
  gap: 18px;
}

.analytics-row {
  display: grid;
  grid-template-columns: 140px minmax(100px, 1fr) 50px;
  align-items: center;
  gap: 14px;
}

.analytics-row > div:first-child {
  display: grid;
  gap: 3px;
}

.analytics-row span {
  color: var(--muted);
  font-size: 0.78rem;
}

.progress-track {
  height: 10px;
  border-radius: 999px;
  background: #eadfd3;
  overflow: hidden;
}

.progress-track span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--gold-dark), var(--gold));
}

.danger-zone {
  margin-top: 28px;
  padding: 18px;
  border: 1px solid #e2b3ae;
  border-radius: 14px;
  background: var(--red-light);
}

.danger-zone h3 {
  margin: 0 0 7px;
  color: #79302a;
}

.danger-zone p {
  margin: 0 0 16px;
  color: #8b4b45;
  line-height: 1.5;
}

.admin-toast {
  position: fixed;
  right: 22px;
  bottom: 22px;
  z-index: 100;
  max-width: min(360px, calc(100vw - 44px));
  padding: 13px 16px;
  border-radius: 11px;
  color: var(--white);
  font-weight: 750;
  opacity: 0;
  transform: translateY(12px);
  transition:
    opacity 0.22s ease,
    transform 0.22s ease;
  box-shadow: 0 14px 30px rgba(30, 20, 16, 0.22);
}

.admin-toast.visible {
  opacity: 1;
  transform: translateY(0);
}

.admin-toast-success {
  background: var(--green);
}

.admin-toast-error {
  background: var(--red);
}

@media (max-width: 1100px) {
  .dashboard-cards {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .product-grid,
  .coupon-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .content-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 820px) {
  .admin-layout {
    display: block;
  }

  .sidebar {
    position: fixed;
    inset: 0 auto 0 0;
    width: min(290px, 84vw);
    transform: translateX(-102%);
    transition: transform 0.22s ease;
    box-shadow: 18px 0 40px rgba(25, 15, 10, 0.28);
  }

  .sidebar.open {
    transform: translateX(0);
  }

  .mobile-menu-button {
    display: inline-flex;
  }

  .topbar {
    padding: 22px 18px 14px;
  }

  .page-content {
    padding: 8px 18px 32px;
  }

  .inline-form {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 620px) {
  .welcome-panel {
    align-items: flex-start;
    flex-direction: column;
    padding: 22px;
  }

  .dashboard-cards,
  .product-grid,
  .coupon-list {
    grid-template-columns: 1fr;
  }

  .panel {
    padding: 18px;
  }

  .panel-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .analytics-row {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .analytics-row > strong {
    justify-self: start;
  }

  .form-actions {
    align-items: stretch;
    flex-direction: column;
  }

  .form-actions button {
    width: 100%;
  }

  .primary-button,
  .secondary-button,
  .danger-button {
    min-height: 44px;
  }
}
