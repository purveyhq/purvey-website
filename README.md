# Purvey marketing website

The complete latest website is in `dist/`, including the landing page, pricing page, scripts, styles and images.

## Preview locally

From this folder run:

```sh
python3 -m http.server 8000 --directory dist
```

Open http://localhost:8000.

## Hosting

Serve `dist/` as the public root. No build step is required.

The `.openai/hosting.json` file identifies the existing ChatGPT Site; it is not required for external static hosting.
