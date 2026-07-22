import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDrqltlq7LiRPH84y1-2lH0ISPsEhEQjak",
  authDomain: "crumb-and-crust.firebaseapp.com",
  projectId: "crumb-and-crust",
  storageBucket: "crumb-and-crust.firebasestorage.app",
  messagingSenderId: "514675143126",
  appId: "1:514675143126:web:3f47f98c476b4b0f96f477"
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);
const auth = getAuth(firebaseApp);

const state = {
  activePage: "dashboard",
  orders: [],
  products: [],
  coupons: [],
  vacation: {
    enabled: false,
    message: "We are temporarily closed for orders.",
    reopenDate: ""
  },
  settings: {
    bakeryName: "Crumb & Crust",
    email: "",
    phone: ""
  }
};

document.addEventListener("DOMContentLoaded", () => {
  const app = document.getElementById("app");

  if (!app) {
    console.error('Could not find an element with id="app".');
    return;
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
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD"
    }).format(Number(value) || 0);
  }

  function formatDate(value) {
    if (!value) return "Not set";

    const date =
      typeof value?.toDate === "function"
        ? value.toDate()
        : new Date(value);

    if (Number.isNaN(date.getTime())) return "Not set";

    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    }).format(date);
  }

  function showToast(message, type = "success") {
    document.querySelector(".admin-toast")?.remove();

    const toast = document.createElement("div");
    toast.className = `admin-toast admin-toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add("visible"), 10);

    setTimeout(() => {
      toast.classList.remove("visible");
      setTimeout(() => toast.remove(), 250);
    }, 2500);
  }

  function reportError(message, error) {
    console.error(message, error);
    showToast(message, "error");
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

  function createNavButton(page, label) {
    return `
      <button
        class="nav-button ${state.activePage === page ? "active" : ""}"
        data-page="${page}"
        type="button"
      >
        ${label}
      </button>
    `;
  }

  function createEmptyState(title, message) {
    return `
      <div class="empty-state">
        <h3>${escapeHtml(title)}</h3>
        <p>${escapeHtml(message)}</p>
      </div>
    `;
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

          <nav class="sidebar-nav">
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
            <span>Connected to Firebase</span>
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

    document.querySelectorAll("[data-page]").forEach(button => {
      button.addEventListener("click", () => {
        state.activePage = button.dataset.page;
        renderApp();
      });
    });

    document
      .getElementById("mobileMenuButton")
      ?.addEventListener("click", () => {
        document.querySelector(".sidebar")?.classList.toggle("open");
      });

    renderPage();
  }

  function renderPage() {
    const container = document.getElementById("pageContent");
    if (!container) return;

    switch (state.activePage) {
      case "orders":
        renderOrders(container);
        break;
      case "vacation":
        renderVacation(container);
        break;
      case "products":
        renderProducts(container);
        break;
      case "coupons":
        renderCoupons(container);
        break;
      case "analytics":
        renderAnalytics(container);
        break;
      case "settings":
        renderSettings(container);
        break;
      default:
        renderDashboard(container);
    }
  }

  function renderDashboard(container) {
    const openOrders = state.orders.filter(
      order =>
        order.status !== "Completed" &&
        order.status !== "Cancelled"
    );

    const availableProducts = state.products.filter(
      product => product.available
    );

    const activeCoupons = state.coupons.filter(
      coupon => coupon.active
    );

    container.innerHTML = `
      <div class="welcome-panel">
        <div>
          <p class="eyebrow">Overview</p>
          <h2>Welcome back.</h2>
          <p>Your dashboard is connected to Cloud Firestore.</p>
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
          <span>${state.products.length} total products</span>
        </article>

        <article class="dashboard-card">
          <p class="card-label">Active coupons</p>
          <strong>${activeCoupons.length}</strong>
          <span>${state.coupons.length} total coupons</span>
        </article>
      </div>

      <div class="panel">
        <div class="panel-header">
          <div>
            <p class="eyebrow">Store status</p>
            <h2>
              ${state.vacation.enabled ? "Orders paused" : "Orders open"}
            </h2>
          </div>
        </div>

        <p>
          ${
            state.vacation.enabled
              ? escapeHtml(state.vacation.message)
              : "Customers can currently place orders."
          }
        </p>
      </div>
    `;

    document
      .getElementById("viewOrdersButton")
      ?.addEventListener("click", () => {
        state.activePage = "orders";
        renderApp();
      });
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
            ? `
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
                    ${state.orders.map(order => `
                      <tr>
                        <td>${escapeHtml(order.orderNumber || order.id)}</td>
                        <td>${escapeHtml(order.customer || order.customerName)}</td>
                        <td>${escapeHtml(order.item || order.itemsSummary || "")}</td>
                        <td>${formatMoney(order.total)}</td>

                        <td>
                          <select data-order-status="${escapeHtml(order.id)}">
                            ${["New", "Preparing", "Ready", "Completed", "Cancelled"]
                              .map(status => `
                                <option
                                  value="${status}"
                                  ${order.status === status ? "selected" : ""}
                                >
                                  ${status}
                                </option>
                              `)
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
                    `).join("")}
                  </tbody>
                </table>
              </div>
            `
            : createEmptyState(
                "No orders yet",
                "Orders stored in Firestore will appear here."
              )
        }
      </div>
    `;

    document
      .getElementById("addOrderButton")
      ?.addEventListener("click", renderOrderForm);

    document.querySelectorAll("[data-order-status]").forEach(select => {
      select.addEventListener("change", async () => {
        try {
          await updateDoc(doc(db, "orders", select.dataset.orderStatus), {
            status: select.value,
            updatedAt: serverTimestamp()
          });

          showToast("Order status updated.");
        } catch (error) {
          reportError("Could not update the order.", error);
        }
      });
    });

    document.querySelectorAll("[data-delete-order]").forEach(button => {
      button.addEventListener("click", async () => {
        if (!confirm("Delete this order?")) return;

        try {
          await deleteDoc(doc(db, "orders", button.dataset.deleteOrder));
          showToast("Order deleted.");
        } catch (error) {
          reportError("Could not delete the order.", error);
        }
      });
    });
  }

  function renderOrderForm() {
    const formArea = document.getElementById("orderFormArea");
    if (!formArea) return;

    formArea.innerHTML = `
      <form class="admin-form inline-form" id="orderForm">
        <label>
          Customer name
          <input name="customer" required maxlength="80">
        </label>

        <label>
          Item
          <input name="item" required maxlength="100">
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

    document
      .getElementById("cancelOrderButton")
      ?.addEventListener("click", () => {
        formArea.innerHTML = "";
      });

    document
      .getElementById("orderForm")
      ?.addEventListener("submit", async event => {
        event.preventDefault();

        const formData = new FormData(event.currentTarget);

        try {
          await addDoc(collection(db, "orders"), {
            orderNumber: `CC-${Date.now().toString().slice(-6)}`,
            customer: String(formData.get("customer")).trim(),
            item: String(formData.get("item")).trim(),
            total: Number(formData.get("total")),
            status: "New",
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });

          showToast("Order added.");
          formArea.innerHTML = "";
        } catch (error) {
          reportError("Could not add the order.", error);
        }
      });
  }

  function renderVacation(container) {
    container.innerHTML = `
      <div class="panel narrow-panel">
        <div class="panel-header">
          <div>
            <p class="eyebrow">Store availability</p>
            <h2>Vacation mode</h2>
          </div>

          <span class="status-badge ${
            state.vacation.enabled
              ? "status-cancelled"
              : "status-completed"
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
            <textarea name="message" rows="4" maxlength="250" required>${escapeHtml(
              state.vacation.message
            )}</textarea>
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

    document
      .getElementById("vacationForm")
      ?.addEventListener("submit", async event => {
        event.preventDefault();

        const formData = new FormData(event.currentTarget);

        try {
          await setDoc(
            doc(db, "settings", "store"),
            {
              vacation: {
                enabled: formData.get("enabled") === "on",
                message: String(formData.get("message")).trim(),
                reopenDate: String(formData.get("reopenDate") || "")
              },
              updatedAt: serverTimestamp()
            },
            { merge: true }
          );

          showToast("Vacation settings saved.");
        } catch (error) {
          reportError("Could not save Vacation Mode.", error);
        }
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
              ? state.products.map(product => `
                  <article class="product-card">
                    <div>
                      <span class="status-badge ${
                        product.available
                          ? "status-completed"
                          : "status-cancelled"
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
                        ${
                          product.available
                            ? "Mark unavailable"
                            : "Mark available"
                        }
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
                `).join("")
              : createEmptyState(
                  "No products yet",
                  "Add your first bakery product."
                )
          }
        </div>
      </div>
    `;

    document
      .getElementById("addProductButton")
      ?.addEventListener("click", renderProductForm);

    document.querySelectorAll("[data-toggle-product]").forEach(button => {
      button.addEventListener("click", async () => {
        const product = state.products.find(
          item => item.id === button.dataset.toggleProduct
        );

        if (!product) return;

        try {
          await updateDoc(doc(db, "products", product.id), {
            available: !product.available,
            updatedAt: serverTimestamp()
          });

          showToast("Product availability updated.");
        } catch (error) {
          reportError("Could not update the product.", error);
        }
      });
    });

    document.querySelectorAll("[data-delete-product]").forEach(button => {
      button.addEventListener("click", async () => {
        if (!confirm("Delete this product?")) return;

        try {
          await deleteDoc(
            doc(db, "products", button.dataset.deleteProduct)
          );

          showToast("Product deleted.");
        } catch (error) {
          reportError("Could not delete the product.", error);
        }
      });
    });
  }

  function renderProductForm() {
    const formArea = document.getElementById("productFormArea");
    if (!formArea) return;

    formArea.innerHTML = `
      <form class="admin-form inline-form" id="productForm">
        <label>
          Product name
          <input name="name" required maxlength="100">
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

    document
      .getElementById("productForm")
      ?.addEventListener("submit", async event => {
        event.preventDefault();

        const formData = new FormData(event.currentTarget);

        try {
          await addDoc(collection(db, "products"), {
            name: String(formData.get("name")).trim(),
            price: Number(formData.get("price")),
            available: true,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });

          showToast("Product added.");
          formArea.innerHTML = "";
        } catch (error) {
          reportError("Could not add the product.", error);
        }
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
            <input name="code" required maxlength="25">
          </label>

          <label>
            Discount percentage
            <input name="discount" type="number" required min="1" max="100">
          </label>

          <button class="primary-button" type="submit">Add coupon</button>
        </form>

        <div class="coupon-list">
          ${
            state.coupons.length
              ? state.coupons.map(coupon => `
                  <article class="coupon-card">
                    <div>
                      <span class="status-badge ${
                        coupon.active
                          ? "status-completed"
                          : "status-cancelled"
                      }">
                        ${coupon.active ? "Active" : "Inactive"}
                      </span>

                      <h3>${escapeHtml(coupon.code)}</h3>
                      <p>${Number(coupon.discount) || 0}% off</p>
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
                `).join("")
              : createEmptyState(
                  "No coupons yet",
                  "Create your first discount code."
                )
          }
        </div>
      </div>
    `;

    document
      .getElementById("couponForm")
      ?.addEventListener("submit", async event => {
        event.preventDefault();

        const formData = new FormData(event.currentTarget);

        try {
          await addDoc(collection(db, "coupons"), {
            code: String(formData.get("code")).trim().toUpperCase(),
            discount: Number(formData.get("discount")),
            active: true,
            createdAt: serverTimestamp()
          });

          event.currentTarget.reset();
          showToast("Coupon added.");
        } catch (error) {
          reportError("Could not add the coupon.", error);
        }
      });

    document.querySelectorAll("[data-toggle-coupon]").forEach(button => {
      button.addEventListener("click", async () => {
        const coupon = state.coupons.find(
          item => item.id === button.dataset.toggleCoupon
        );

        if (!coupon) return;

        try {
          await updateDoc(doc(db, "coupons", coupon.id), {
            active: !coupon.active
          });

          showToast("Coupon updated.");
        } catch (error) {
          reportError("Could not update the coupon.", error);
        }
      });
    });

    document.querySelectorAll("[data-delete-coupon]").forEach(button => {
      button.addEventListener("click", async () => {
        try {
          await deleteDoc(
            doc(db, "coupons", button.dataset.deleteCoupon)
          );

          showToast("Coupon deleted.");
        } catch (error) {
          reportError("Could not delete the coupon.", error);
        }
      });
    });
  }

  function renderAnalytics(container) {
    const completed = state.orders.filter(
      order => order.status === "Completed"
    ).length;

    const cancelled = state.orders.filter(
      order => order.status === "Cancelled"
    ).length;

    const revenue = state.orders
      .filter(order => order.status !== "Cancelled")
      .reduce((total, order) => total + Number(order.total || 0), 0);

    container.innerHTML = `
      <div class="dashboard-cards">
        <article class="dashboard-card">
          <p class="card-label">Revenue</p>
          <strong>${formatMoney(revenue)}</strong>
          <span>Excludes cancelled orders</span>
        </article>

        <article class="dashboard-card">
          <p class="card-label">Total orders</p>
          <strong>${state.orders.length}</strong>
          <span>Firestore orders</span>
        </article>

        <article class="dashboard-card">
          <p class="card-label">Completed</p>
          <strong>${completed}</strong>
          <span>Finished orders</span>
        </article>

        <article class="dashboard-card">
          <p class="card-label">Cancelled</p>
          <strong>${cancelled}</strong>
          <span>Cancelled orders</span>
        </article>
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

          <button class="primary-button" type="submit">
            Save settings
          </button>
        </form>
      </div>
    `;

    document
      .getElementById("settingsForm")
      ?.addEventListener("submit", async event => {
        event.preventDefault();

        const formData = new FormData(event.currentTarget);

        try {
          await setDoc(
            doc(db, "settings", "store"),
            {
              business: {
                bakeryName: String(formData.get("bakeryName")).trim(),
                email: String(formData.get("email")).trim(),
                phone: String(formData.get("phone")).trim()
              },
              updatedAt: serverTimestamp()
            },
            { merge: true }
          );

          showToast("Settings saved.");
        } catch (error) {
          reportError("Could not save the settings.", error);
        }
      });
  }

  function startRealtimeListeners() {
    const ordersQuery = query(
      collection(db, "orders"),
      orderBy("createdAt", "desc")
    );

    onSnapshot(
      ordersQuery,
      snapshot => {
        state.orders = snapshot.docs.map(documentSnapshot => ({
          id: documentSnapshot.id,
          ...documentSnapshot.data()
        }));

        renderApp();
      },
      error => {
        reportError("Could not load orders from Firebase.", error);
      }
    );

    onSnapshot(
      collection(db, "products"),
      snapshot => {
        state.products = snapshot.docs.map(documentSnapshot => ({
          id: documentSnapshot.id,
          ...documentSnapshot.data()
        }));

        renderApp();
      },
      error => {
        reportError("Could not load products from Firebase.", error);
      }
    );

    onSnapshot(
      collection(db, "coupons"),
      snapshot => {
        state.coupons = snapshot.docs.map(documentSnapshot => ({
          id: documentSnapshot.id,
          ...documentSnapshot.data()
        }));

        renderApp();
      },
      error => {
        reportError("Could not load coupons from Firebase.", error);
      }
    );

    onSnapshot(
      doc(db, "settings", "store"),
      documentSnapshot => {
        if (documentSnapshot.exists()) {
          const data = documentSnapshot.data();

          state.vacation = {
            ...state.vacation,
            ...(data.vacation || {})
          };

          state.settings = {
            ...state.settings,
            ...(data.business || {})
          };
        }

        renderApp();
      },
      error => {
        reportError("Could not load store settings.", error);
      }
    );
  }

  renderApp();
  startRealtimeListeners();
});
