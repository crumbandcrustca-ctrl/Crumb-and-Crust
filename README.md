# Crumb & Crust — website

Plain HTML/CSS/JS. No build tools, no framework, no page builder — every file here can be opened straight in a browser or dropped into any static host.

## What's in here

```
index.html       home
about.html       about our team
contact.html     contact us
menu.html        "homemade breads" — menu landing page
sourdough.html   sourdough products
focaccia.html    focaccia products
order.html       the order form
style.css        all styling
script.js        nav behavior + the order form logic
*.jpg            product photos (sit next to the HTML files, no subfolder)
```

Everything lives in one flat folder on purpose — no subfolders — so nothing can get separated when downloading or moving files around.

## Preview it right now

Double-click `index.html`. It opens in your browser and every link between pages works, since they're all just relative links sitting next to each other.

## Putting it on the internet

Any static host works, since there's no server-side code. Two easy free options:

- **Netlify** — drag the whole `crumb-and-crust` folder onto app.netlify.com/drop. You get a live URL instantly, and can add a custom domain later.
- **GitHub Pages** — create a repo, upload these files, turn on Pages in the repo settings.

## Connecting the order form (2 minutes)

The order form on `order.html` needs somewhere to send submissions, since a plain static site has no inbox of its own. It's wired for **Formspree**, a free service that turns form submissions into emails — no code, no server.

1. Go to formspree.io and sign up free.
2. Create a new form, connect it to crumbandcrustca@gmail.com, and confirm the verification email.
3. Copy the endpoint it gives you (looks like `https://formspree.io/f/abcduvwx`).
4. Open `script.js`, find this near the top:
   ```js
   const FORM_ENDPOINT = 'https://formspree.io/f/YOUR_FORM_ID';
   ```
   and replace the URL with your real one.

That's it — orders will land in your inbox with the customer's info, pickup/delivery choice, date, and item quantities. Until you do this, the form shows a polite "not connected yet" message instead of failing silently, so you'll always know if it's live.

**If you end up hosting on Netlify specifically**, there's an even simpler option that skips Formspree entirely (Netlify reads the form for you) — just ask and it's a small edit.

## Changing prices or the 4-item limit

Also near the top of `script.js`:

```js
const MAX_ITEMS_PER_ORDER = 4; // matches your "Product (4 maximum)" rule from the old order form
const DELIVERY_FEE = 4;        // dollars, added to the estimated total when Delivery is selected
```

Change `4` to whatever cap you want — the form re-checks this everywhere (the counter, the +/- buttons, and the final submit) so it stays consistent.

To change an individual item's price, open `order.html`, find the item (e.g. `Rosemary Focaccia (Large)`), and update the `data-price="14.00"` attribute on its quantity input, plus the price shown next to its name just above it. Both need to match, since one is what's shown to customers and the other is what the live total actually calculates from.

## Pausing or limiting orders

Near the top of `script.js`:

```js
const ORDER_SETTINGS = {
  acceptingOrders: true,     // set to false to close the form for the week
  limitedCapacityNote: true, // set to false to hide the "small batches" note
};
```

There's no live counter of how many orders have come in (that needs a real database, which is a bigger step up from a static site) — but flipping `acceptingOrders` to `false` closes the form instantly with a clear message, and back to `true` reopens it. Good enough for "I'm full for this week."

## Adding the two missing photos

`rosemary sourdough` and `margherita focaccia` currently show a "photo coming soon" placeholder (matching your old site, which didn't have photos for these either). To add them:

1. Drop your photo file in this same folder, next to the HTML files.
2. In `sourdough.html` or `focaccia.html`, find the matching `<div class="placeholder-photo">` block and replace it with:
   ```html
   <img src="your-file-name.jpg" alt="Describe the photo here">
   ```

## Other small things worth doing

- **Reviews button** on `contact.html` currently links to `#` (a placeholder). Once your Yelp listing is approved, swap in the real review link.
- **Adding more flavors**: copy one `.product-row` block in `sourdough.html`/`focaccia.html` and one `.order-item` block in `order.html`, then update the name, description, and photo.
- **Cottage food disclosure**: some counties require specific label language (e.g. "made in a home kitchen") on packaging or point-of-sale listings — worth a quick check with your permit paperwork on whether that extends to the order form, since requirements vary by county.
