document.addEventListener("DOMContentLoaded", () => {
  const app = document.getElementById("app");

  app.innerHTML = `
    <div class="admin-container">
      <header class="admin-header">
        <h1>Crumb & Crust Admin</h1>
        <p>Welcome to the bakery management dashboard.</p>
      </header>

      <main class="dashboard">
        <div class="card">
          <h2>Orders</h2>
          <p>Coming Soon</p>
        </div>

        <div class="card">
          <h2>Vacation Mode</h2>
          <p>Coming Soon</p>
        </div>

        <div class="card">
          <h2>Products</h2>
          <p>Coming Soon</p>
        </div>

        <div class="card">
          <h2>Analytics</h2>
          <p>Coming Soon</p>
        </div>
      </main>
    </div>
  `;
});
