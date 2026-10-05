# Purvey Website

Official marketing website for **Purvey by Secern Technologies**.

Purvey helps Nigerian businesses create an online storefront and manage products, inventory, orders, customers and payments.

## Tech stack

- HTML
- CSS
- Vanilla JavaScript
- SVG, PNG and WebP assets

The website is static and requires no build step or database.

## Project structure

All website files are in `dist/`, including the landing page, pricing page, styles, scripts and images.

## Local preview

Run from the repository root:

```sh
python3 -m http.server 8000 --directory dist
```

Open http://localhost:8000.

## Vercel deployment

Import this repository into Vercel using:

| Setting | Value |
|---|---|
| Framework Preset | Other |
| Root Directory | Repository root |
| Build Command | Empty |
| Output Directory | `dist` |
| Install Command | Empty |

## Website addresses

- Marketing website: https://purveyhq.com
- Merchant application: https://app.purveyhq.com
